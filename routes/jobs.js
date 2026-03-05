import express from 'express';
import mongoose from 'mongoose';
import { createRequire } from 'module';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const requirePdf = createRequire(import.meta.url);
const PDFDocument = requirePdf('pdfkit');
import Job, { slugify, randomDigits } from '../models/Job.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Sector from '../models/Sector.js';
import JobDispute from '../models/JobDispute.js';
import Wallet from '../models/Wallet.js';
import Notification from '../models/Notification.js';
import JobReport from '../models/JobReport.js';
import { getIO } from '../services/socket.js';

const router = express.Router();

/** Emit job:updated to client and quoted professionals so they get real-time updates without polling */
function emitJobUpdated(job) {
  try {
    const io = getIO();
    const jobId = job._id.toString();
    const clientId = job.clientId?.toString?.();
    if (clientId) io.to(`user:${clientId}`).emit('job:updated', { jobId });
    (job.quotes || []).forEach((q) => {
      const proId = q.professionalId?.toString?.();
      if (proId) io.to(`user:${proId}`).emit('job:updated', { jobId });
    });
  } catch (_) {}
}

// Haversine distance in miles between two WGS84 coordinates
function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3959; // Earth radius in miles
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Bulk geocode UK postcodes via postcodes.io (returns array of { latitude, longitude } or null, same order as input)
async function bulkGeocodePostcodes(postcodes) {
  const trimmed = postcodes.map((pc) => String(pc || '').trim().toUpperCase());
  const toLookup = trimmed.filter(Boolean);
  if (toLookup.length === 0) return trimmed.map(() => null);
  const url = 'https://api.postcodes.io/postcodes';
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ postcodes: toLookup }),
  });
  if (!res.ok) return trimmed.map(() => null);
  const data = await res.json();
  const results = (data.result || []).map((item) => {
    const r = item && item.result;
    if (r && typeof r.latitude === 'number' && typeof r.longitude === 'number') {
      return { latitude: r.latitude, longitude: r.longitude };
    }
    return null;
  });
  let idx = 0;
  return trimmed.map((pc) => {
    if (!pc) return null;
    const r = results[idx];
    idx += 1;
    return r ?? null;
  });
}

function toJobResponse(doc) {
  if (!doc) return null;
  const job = doc.toObject ? doc.toObject() : doc;
  return {
    id: job._id.toString(),
    slug: job.slug || job._id.toString(),
    title: job.title,
    description: job.description,
    sector: job.sectorName,
    sectorId: job.sector?.toString?.() || job.sector || undefined,
    sectorSlug: job.sectorSlug,
    categories: job.categoryLabels || [],
    categorySlugs: job.categorySlugs || [],
    postcode: job.postcode,
    address: job.address,
    location: job.location,
    timing: job.timing,
    specificDate: job.specificDate ? new Date(job.specificDate).toISOString().split('T')[0] : undefined,
    budgetType: job.budgetType,
    budgetAmount: job.budgetAmount,
    budgetMin: job.budgetMin != null ? job.budgetMin : undefined,
    budgetMax: job.budgetMax != null ? job.budgetMax : undefined,
    status: job.status,
    postedAt: job.postedAt ? new Date(job.postedAt).toISOString() : new Date().toISOString(),
    clientId: job.clientId?.toString?.() || job.clientId,
    quotes: (job.quotes || []).map((q) => ({
      id: q._id.toString(),
      professionalId: q.professionalId?.toString?.() || q.professionalId,
      professionalName: q.professionalName,
      professionalAvatar: q.professionalAvatar,
      professionalRating: q.professionalRating ?? 0,
      professionalReviews: q.professionalReviews ?? 0,
      price: q.price,
      deliveryTime: q.deliveryTime,
      message: q.message,
      submittedAt: q.submittedAt ? new Date(q.submittedAt).toISOString() : null,
      status: q.status,
      suggestedMilestones: (q.suggestedMilestones || []).map((m) => ({
        id: m._id.toString(),
        description: m.description,
        amount: m.amount,
        status: m.status || 'pending',
      })),
    })),
    awardedProfessionalId: job.awardedProfessionalId?.toString?.() || job.awardedProfessionalId || undefined,
    milestones: (job.milestones || []).map((m) => ({
      id: m._id.toString(),
      name: m.name || m.description || 'Milestone',
      description: m.description,
      amount: m.amount,
      status: m.status,
      createdAt: m.createdAt ? new Date(m.createdAt).toISOString() : new Date().toISOString(),
      releasedAt: m.releasedAt ? new Date(m.releasedAt).toISOString() : undefined,
      disputeId: m.disputeId?.toString?.() || m.disputeId || undefined,
      cancelRequestedAt: m.cancelRequestedAt ? new Date(m.cancelRequestedAt).toISOString() : undefined,
      cancelRequestedBy: m.cancelRequestedBy?.toString?.() || m.cancelRequestedBy || undefined,
      cancelRequestReason: m.cancelRequestReason || undefined,
      cancelRequestStatus: m.cancelRequestStatus || undefined,
      releaseRequestedAt: m.releaseRequestedAt ? new Date(m.releaseRequestedAt).toISOString() : undefined,
      releaseRequestedBy: m.releaseRequestedBy?.toString?.() || m.releaseRequestedBy || undefined,
      releaseRequestStatus: m.releaseRequestStatus || undefined,
    })),
  };
}

// Generate job title and description using OpenAI (client only; key points required; sector optional)
router.post('/generate-description', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const { sectorName, sectorSlug, keyPoints } = req.body;
    const sectorLabel = (sectorName || sectorSlug || '').trim();
    const points = typeof keyPoints === 'string' ? keyPoints.trim() : '';
    if (!points) {
      return res.status(400).json({ error: 'Please enter some key points or keywords about your job' });
    }

    const apiKey = process.env.OPENAI_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'AI generation is not configured' });
    }

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey });

    const systemPrompt = `You are a helpful assistant that writes clear, professional job postings for a trades and services platform (UK). The posting is written by a single client (homeowner or business owner). Given a sector and optional key points or keywords from the client, you must respond in valid JSON only with exactly two keys: "title" and "description".
1. title: A short job headline (one concise line, e.g. "Install new bathroom suite" or "Fix leaking kitchen tap").
2. description: A full job description - well structured and easy to read. IMPORTANT: Use actual line breaks (newlines) for formatting:
   - Put each section on its own line or block (e.g. "Overview:", "What I need:", "Scope of work:", "Timing/Preferences:").
   - After each section label, start the content on the next line or after a colon and space.
   - Use bullet points as a dash or bullet at the start of a line, with one item per line (e.g. "- Item one\\n- Item two").
   - Separate paragraphs with a blank line (double newline) for clarity.
   Use plain text only, no markdown (no ## or **). Write in first person singular only: "I", "my", "me". Never use "we" or "our". Keep tone professional but friendly. Keep description between 150 and 400 words.`;

    const sectorPart = sectorLabel ? `Sector: ${sectorLabel}. ` : '';
    const userPrompt = sectorLabel
      ? `${sectorPart}Key points or keywords from the client: ${points}. Generate a job title and a full, structured job description. Use newlines in the description between sections and for bullet points so it displays with clear line breaks and structure. Return valid JSON with "title" and "description".`
      : `Key points or keywords from the client: ${points}. Generate a job title and a full, structured job description for a trades and services job. Use newlines in the description between sections and for bullet points so it displays with clear line breaks and structure. Return valid JSON with "title" and "description".`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return res.status(502).json({ error: 'Empty response from AI' });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: 'Invalid AI response format' });
    }

    const title = (parsed.title || parsed.jobTitle || parsed.headline || '').trim();
    const description = (parsed.description || parsed.jobDescription || parsed.body || '').trim();
    if (!title || !description) {
      return res.status(502).json({ error: 'AI did not return title and description' });
    }

    return res.json({ title, description });
  } catch (err) {
    console.error('[Jobs] Generate description error:', err);
    if (err.status === 401) {
      return res.status(503).json({ error: 'AI service configuration error' });
    }
    return res.status(500).json({ error: err.message || 'Failed to generate description' });
  }
});

// Generate quote message to client using OpenAI (professional only)
router.post('/generate-quote-message', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const { jobTitle, jobDescription, sectorName, keyPoints, tradingName } = req.body;
    const title = typeof jobTitle === 'string' ? jobTitle.trim() : '';
    const description = typeof jobDescription === 'string' ? jobDescription.trim() : '';
    const sector = typeof sectorName === 'string' ? sectorName.trim() : '';
    const points = typeof keyPoints === 'string' ? keyPoints.trim() : '';
    const proName = typeof tradingName === 'string' ? tradingName.trim() : '';
    if (!title) {
      return res.status(400).json({ error: 'Job title is required' });
    }

    const apiKey = process.env.OPENAI_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'AI generation is not configured' });
    }

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey });

    const systemPrompt = `You are a helpful assistant for UK trades professionals. You write a quote message that a professional sends to a client when submitting a quote. The message must be in valid JSON only with a single key "message".

Structure the "message" exactly as follows (do not invent random content). IMPORTANT: Use actual line breaks (newlines) so the message is easy to read:
1. Greeting: A short, professional greeting to the client (first line).
2. Blank line, then Introduction: One sentence introducing the professional by their trading/business name (use the name provided).
3. Blank line, then Body: Content clearly tied to THIS specific job. Reference the job title and what the client needs. Briefly describe relevant experience. Use short paragraphs separated by a blank line (double newline) between paragraphs.
Do not generate generic or random text. Every sentence should relate to the job or the professional's relevant experience. Total length under 200 words. Output valid JSON with key "message". The "message" string must contain real newline characters (\\n) between paragraphs so it displays with proper line breaks.`;

    const context = [
      sector ? `Sector: ${sector}.` : '',
      description ? `Full job description (use this to tailor your response): ${description.slice(0, 600)}.` : '',
      points ? `Professional's key points to include: ${points}.` : '',
      proName ? `Professional's trading/business name to introduce: ${proName}.` : '',
    ].filter(Boolean).join(' ');
    const userPrompt = `Job title: "${title}". ${context} Write the quote message in valid JSON with one key "message". Use newlines: greeting on first line, then a blank line, then introduction, then a blank line, then body paragraphs with a blank line between each paragraph. Start with a greeting, then introduce the trading name, then a short paragraph tied to this job and the professional's relevant experience.`;

    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices?.[0]?.message?.content?.trim();
    if (!raw) {
      return res.status(502).json({ error: 'Empty response from AI' });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch {
      return res.status(502).json({ error: 'Invalid AI response format' });
    }

    const message = (parsed.message || parsed.text || '').trim();
    if (!message) {
      return res.status(502).json({ error: 'AI did not return a message' });
    }

    return res.json({ message });
  } catch (err) {
    console.error('[Jobs] Generate quote message error:', err);
    if (err.status === 401) {
      return res.status(503).json({ error: 'AI service configuration error' });
    }
    return res.status(500).json({ error: err.message || 'Failed to generate message' });
  }
});

// Create job (client only)
router.post('/', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const {
      title,
      description,
      sectorId,
      sectorSlug,
      sectorName,
      categorySlugs,
      categoryLabels,
      postcode,
      address,
      location,
      timing,
      specificDate,
      budgetType,
      budgetAmount,
      budgetMin,
      budgetMax,
    } = req.body;

    if (!title?.trim() || !description?.trim()) {
      return res.status(400).json({ error: 'Title and description are required' });
    }
    if (!postcode?.trim() || !location?.trim()) {
      return res.status(400).json({ error: 'Postcode and location are required' });
    }

    let resolvedBudgetAmount = budgetAmount != null && !isNaN(Number(budgetAmount)) ? Number(budgetAmount) : null;
    let resolvedBudgetMin = budgetMin != null && budgetMin !== '' && !isNaN(Number(budgetMin)) ? Number(budgetMin) : null;
    let resolvedBudgetMax = budgetMax != null && budgetMax !== '' && !isNaN(Number(budgetMax)) ? Number(budgetMax) : null;

    if (resolvedBudgetMin != null && resolvedBudgetMax != null) {
      if (resolvedBudgetMin < 0 || resolvedBudgetMax < 0) {
        return res.status(400).json({ error: 'Budget min and max must be 0 or greater' });
      }
      if (resolvedBudgetMin > resolvedBudgetMax) {
        return res.status(400).json({ error: 'Budget min must not exceed budget max' });
      }
      if (resolvedBudgetAmount == null || isNaN(resolvedBudgetAmount)) {
        resolvedBudgetAmount = Math.round((resolvedBudgetMin + resolvedBudgetMax) / 2);
      }
    } else {
      if (resolvedBudgetAmount == null || isNaN(resolvedBudgetAmount) || resolvedBudgetAmount < 0) {
        return res.status(400).json({ error: 'Valid budget amount or budget min/max range is required' });
      }
    }

    // Resolve sector using ID as the source of truth; fall back to slug/name for backward compatibility
    let sectorDoc = null;
    if (sectorId && mongoose.Types.ObjectId.isValid(sectorId)) {
      sectorDoc = await Sector.findById(sectorId).lean();
      if (!sectorDoc) {
        return res.status(400).json({ error: 'Invalid sectorId - sector not found' });
      }
    } else if (sectorSlug || sectorName) {
      const query = [];
      if (sectorSlug) {
        query.push({ slug: String(sectorSlug).trim().toLowerCase() });
      }
      if (sectorName) {
        query.push({ name: String(sectorName).trim() });
      }
      if (query.length === 0) {
        return res.status(400).json({ error: 'Sector information is required' });
      }
      sectorDoc = await Sector.findOne({ $or: query }).lean();
      if (!sectorDoc) {
        return res.status(400).json({ error: 'Sector not found for provided slug/name' });
      }
    } else {
      return res.status(400).json({ error: 'Sector information is required' });
    }

    const jobPayload = {
      title: title.trim(),
      description: description.trim(),
      sector: sectorDoc._id,
      sectorSlug: sectorDoc.slug,
      sectorName: sectorDoc.name,
      categorySlugs: Array.isArray(categorySlugs) ? categorySlugs : [],
      categoryLabels: Array.isArray(categoryLabels) ? categoryLabels : [],
      postcode: postcode.trim(),
      address: address ? String(address).trim() : '',
      location: location.trim(),
      timing: ['urgent', 'flexible', 'specific'].includes(timing) ? timing : 'flexible',
      specificDate: specificDate ? new Date(specificDate) : null,
      budgetType: budgetType === 'hourly' ? 'hourly' : 'fixed',
      budgetAmount: resolvedBudgetAmount,
      status: 'open',
      clientId: req.user.id,
    };
    if (resolvedBudgetMin != null) jobPayload.budgetMin = resolvedBudgetMin;
    if (resolvedBudgetMax != null) jobPayload.budgetMax = resolvedBudgetMax;

    const job = new Job(jobPayload);

    await job.save();
    emitJobUpdated(job);
    res.status(201).json(toJobResponse(job));
  } catch (err) {
    console.error('[Jobs] Create error:', err);
    res.status(500).json({ error: err.message || 'Failed to create job' });
  }
});

// List jobs: client = my jobs; professional = available (matching sector)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { status, sectorSlug } = req.query;
    const role = req.user.role;

    if (role === 'client') {
      const query = { clientId: req.user.id };
      if (status && status !== 'all') query.status = status;
      const jobs = await Job.find(query).sort({ postedAt: -1 }).lean();
      for (const job of jobs) {
        await ensureJobSlug(job);
      }
      return res.json(jobs.map((j) => toJobResponse(j)));
    }

    if (role === 'professional') {
      const user = await User.findById(req.user.id).select('sectors sector').lean();
      const rawSectorValues =
        user?.sectors?.length ? user.sectors : user?.sector ? [user.sector] : [];
      if (!rawSectorValues.length) {
        return res.json([]);
      }

      const sectorObjectIds = rawSectorValues
        .filter((val) => mongoose.Types.ObjectId.isValid(val))
        .map((val) => new mongoose.Types.ObjectId(val));

      if (!sectorObjectIds.length) {
        return res.json([]);
      }

      // Include: active jobs in sector (to quote) OR jobs awarded to this pro (awaiting-accept / in-progress)
      const query = {
        $or: [
          { status: 'open', sector: { $in: sectorObjectIds } },
          {
            status: { $in: ['awaiting-accept', 'in-progress'] },
            awardedProfessionalId: new mongoose.Types.ObjectId(req.user.id),
          },
        ],
      };
      const jobs = await Job.find(query).sort({ postedAt: -1 }).lean();
      for (const job of jobs) {
        await ensureJobSlug(job);
      }
      return res.json(jobs.map((j) => toJobResponse(j)));
    }

    return res.status(403).json({ error: 'Only client or professional can list jobs' });
  } catch (err) {
    console.error('[Jobs] List error:', err);
    res.status(500).json({ error: err.message || 'Failed to list jobs' });
  }
});

function isMongoId(str) {
  return typeof str === 'string' && str.length === 24 && /^[a-f0-9]{24}$/i.test(str);
}

/** Ensure job has a slug in format title-slug-6digits; backfill and save if missing */
async function ensureJobSlug(job) {
  if (job.slug) return job.slug;
  const base = slugify(job.title).slice(0, 40);
  let slug = `${base}-${randomDigits(6)}`;
  let exists = await Job.findOne({ slug, _id: { $ne: job._id } });
  while (exists) {
    slug = `${base}-${randomDigits(8)}`;
    exists = await Job.findOne({ slug });
  }
  await Job.findByIdAndUpdate(job._id, { slug });
  job.slug = slug;
  return slug;
}

async function findJobByIdOrSlug(idOrSlug) {
  if (isMongoId(idOrSlug)) {
    const byId = await Job.findById(idOrSlug).lean();
    if (byId) return byId;
  }
  return Job.findOne({ slug: idOrSlug }).lean();
}

// Get single job (by id or slug)
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const job = await findJobByIdOrSlug(req.params.id);
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    await ensureJobSlug(job);
    const isClient = req.user.role === 'client' && job.clientId.toString() === req.user.id;
    const isPro = req.user.role === 'professional';
    const user = isPro ? await User.findById(req.user.id).select('sectors sector').lean() : null;
    const rawSectorValues =
      user?.sectors?.length ? user.sectors : user?.sector ? [user.sector] : [];
    const proSectorIdStrings = rawSectorValues.filter((val) => mongoose.Types.ObjectId.isValid(val));
    const jobSectorId = job.sector ? job.sector.toString() : null;
    const hasQuoted = isPro && (job.quotes || []).some((q) => q.professionalId && q.professionalId.toString() === req.user.id);
    const sectorMatch = !!jobSectorId && proSectorIdStrings.includes(jobSectorId);
    const canView = isClient || (isPro && (sectorMatch || hasQuoted));
    if (!canView) {
      return res.status(403).json({ error: 'Not allowed to view this job' });
    }
    const response = toJobResponse(job);
    const clientUser = await User.findById(job.clientId).select('firstName lastName tradingName avatar createdAt').lean();
    if (clientUser) {
      response.clientName = clientUser.tradingName || [clientUser.firstName, clientUser.lastName].filter(Boolean).join(' ') || 'Client';
      response.clientAvatar = clientUser.avatar;
      response.clientMemberSince = clientUser.createdAt ? new Date(clientUser.createdAt).toISOString() : undefined;
    }
    // Ensure each quote has the professional's current avatar (from User) so avatars always display
    const quoteProIds = [...new Set((response.quotes || []).map((q) => q.professionalId).filter(Boolean))];
    if (quoteProIds.length > 0) {
      const proAvatars = await User.find({ _id: { $in: quoteProIds } }).select('avatar').lean();
      const avatarByProId = Object.fromEntries(proAvatars.map((u) => [u._id.toString(), u.avatar]).filter(([, v]) => v != null));
      response.quotes = response.quotes.map((q) => ({
        ...q,
        professionalAvatar: avatarByProId[q.professionalId] ?? q.professionalAvatar,
      }));
    }
    res.json(response);
  } catch (err) {
    console.error('[Jobs] Get error:', err);
    res.status(500).json({ error: err.message || 'Failed to get job' });
  }
});

// Get recommended professionals for a job (same sector, sorted by rating then reviews)
router.get('/:id/recommended-professionals', authenticateToken, async (req, res) => {
  try {
    const job = await findJobByIdOrSlug(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const jobSectorId = job.sector ? job.sector.toString() : null;
    if (!jobSectorId) return res.json({ professionals: [] });

    const quotedProfessionalIds = (job.quotes || [])
      .map((q) => q.professionalId && q.professionalId.toString())
      .filter(Boolean);
    const quotedObjectIds = quotedProfessionalIds
      .filter((id) => mongoose.Types.ObjectId.isValid(id))
      .map((id) => new mongoose.Types.ObjectId(id));

    const sectorFilter = {
      $or: [
        { sector: jobSectorId },
        { sectors: jobSectorId },
      ],
    };
    const professionals = await User.find({
      role: 'professional',
      isDeleted: { $ne: true },
      isBlocked: { $ne: true },
      ...sectorFilter,
      ...(quotedObjectIds.length ? { _id: { $nin: quotedObjectIds } } : {}),
    })
      .select('_id tradingName firstName lastName avatar postcode address townCity')
      .lean();

    if (professionals.length === 0) return res.json({ professionals: [] });

    const proIds = professionals.map((p) => p._id);
    const reviewStats = await Review.aggregate([
      { $match: { professional: { $in: proIds }, isHidden: { $ne: true } } },
      { $group: { _id: '$professional', avgRating: { $avg: '$rating' }, reviewCount: { $sum: 1 } } },
    ]);
    const statsByPro = {};
    reviewStats.forEach((s) => {
      statsByPro[s._id.toString()] = {
        rating: Math.round(s.avgRating * 10) / 10,
        reviewCount: s.reviewCount,
      };
    });

    // Geocode job + all professionals for distance (same order: job first, then each pro)
    const jobPostcode = (job.postcode || '').trim();
    const postcodesToGeocode = [jobPostcode, ...professionals.map((p) => (p.postcode || '').trim())];
    let coords = [];
    try {
      coords = await bulkGeocodePostcodes(postcodesToGeocode);
    } catch (e) {
      console.warn('[Jobs] Geocode for recommended professionals failed:', e?.message);
    }
    const jobCoords = coords[0] || null;

    const sectorName = job.sectorName || 'Professional';
    const list = professionals
      .map((pro, index) => {
        const id = pro._id.toString();
        const stats = statsByPro[id] || { rating: 0, reviewCount: 0 };
        const proCoords = coords[index + 1] || null;
        const distanceMiles =
          jobCoords && proCoords
            ? Math.round(haversineMiles(jobCoords.latitude, jobCoords.longitude, proCoords.latitude, proCoords.longitude) * 10) / 10
            : null;
        return {
          id,
          name: pro.tradingName || [pro.firstName, pro.lastName].filter(Boolean).join(' ') || 'Professional',
          title: pro.tradingName || 'Professional',
          category: sectorName,
          image: pro.avatar,
          rating: stats.rating,
          reviewCount: stats.reviewCount,
          completedJobs: 0,
          location: [pro.townCity, pro.postcode].filter(Boolean).join(', ') || pro.postcode || '',
          skills: [],
          distanceMiles,
        };
      })
      .sort((a, b) => {
        if (b.rating !== a.rating) return b.rating - a.rating;
        return b.reviewCount - a.reviewCount;
      })
      .slice(0, 10);

    return res.json({ professionals: list });
  } catch (err) {
    console.error('[Jobs] Recommended professionals error:', err);
    res.status(500).json({ error: err.message || 'Failed to get recommended professionals' });
  }
});

// Client: invite professional to quote (sends notification to professional; link to job detail)
router.post('/:id/invite-professional', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const job = await findJobByIdOrSlug(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.clientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed to invite for this job' });
    }
    const { professionalId } = req.body;
    if (!professionalId) return res.status(400).json({ error: 'professionalId is required' });
    const pro = await User.findById(professionalId).select('_id role tradingName firstName lastName').lean();
    if (!pro || pro.role !== 'professional') return res.status(404).json({ error: 'Professional not found' });
    const jobSlug = job.slug || job._id.toString();
    const jobTitle = job.title || 'Job';
    const clientName = req.user.name || req.user.firstName || 'A client';
    await Notification.createNotification({
      userId: pro._id,
      type: 'job_invitation',
      title: 'Job quote invitation',
      message: `${clientName} invited you to submit a quote for "${jobTitle}".`,
      relatedId: job._id,
      relatedModel: 'Job',
      link: `/job/${jobSlug}`,
      metadata: { jobId: job._id.toString(), jobSlug, jobTitle, clientId: req.user.id },
    });
    return res.json({ success: true, message: 'Invitation sent' });
  } catch (err) {
    console.error('[Jobs] Invite professional error:', err);
    res.status(500).json({ error: err.message || 'Failed to send invitation' });
  }
});

// Report job (send message to admin; logged-in client or professional only)
router.post('/:id/report', authenticateToken, async (req, res) => {
  try {
    if (req.user.isAdmin) return res.status(403).json({ error: 'Not allowed' });
    const job = await findJobByIdOrSlug(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!message) return res.status(400).json({ error: 'Message is required' });
    await JobReport.create({
      jobId: job._id,
      reporterId: new mongoose.Types.ObjectId(req.user.id),
      reporterRole: req.user.role === 'client' ? 'client' : req.user.role === 'professional' ? 'professional' : undefined,
      message,
    });
    return res.json({ success: true, message: 'Report submitted. Our team will review it.' });
  } catch (err) {
    console.error('[Jobs] Report job error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit report' });
  }
});

// Update job (client owner only)
router.patch('/:id', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.clientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed to update this job' });
    }
    const allowed = [
      'title',
      'description',
      'postcode',
      'address',
      'location',
      'timing',
      'specificDate',
      'budgetType',
      'budgetAmount',
      'budgetMin',
      'budgetMax',
      'status',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'specificDate') job[key] = req.body[key] ? new Date(req.body[key]) : null;
        else if (key === 'budgetAmount') job[key] = Number(req.body[key]);
        else if (key === 'budgetMin') job.budgetMin = req.body[key] === null || req.body[key] === '' ? null : Number(req.body[key]);
        else if (key === 'budgetMax') job.budgetMax = req.body[key] === null || req.body[key] === '' ? null : Number(req.body[key]);
        else if (key === 'status' && ['open', 'cancelled'].includes(req.body[key])) job[key] = req.body[key];
        else if (key !== 'status') job[key] = req.body[key];
      }
    }
    await job.save();
    emitJobUpdated(job);
    res.json(toJobResponse(job));
  } catch (err) {
    console.error('[Jobs] Update error:', err);
    res.status(500).json({ error: err.message || 'Failed to update job' });
  }
});

// Delete job (client owner only)
router.delete('/:id', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.clientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed to delete this job' });
    }
    await Job.findByIdAndDelete(req.params.id);
    res.json({ message: 'Job deleted' });
  } catch (err) {
    console.error('[Jobs] Delete error:', err);
    res.status(500).json({ error: err.message || 'Failed to delete job' });
  }
});

// Submit quote (professional only)
router.post('/:id/quotes', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'open') {
      return res.status(400).json({ error: 'Job is not accepting quotes' });
    }
    const fullUser = await User.findById(req.user.id)
      .select('tradingName firstName lastName avatar sectors sector')
      .lean();
    const rawSectorValues =
      fullUser?.sectors?.length ? fullUser.sectors : fullUser?.sector ? [fullUser.sector] : [];
    const proSectorIdStrings = rawSectorValues.filter((val) => mongoose.Types.ObjectId.isValid(val));
    const jobSectorId = job.sector ? job.sector.toString() : null;
    if (!jobSectorId || !proSectorIdStrings.includes(jobSectorId)) {
      return res.status(403).json({ error: 'Your sector does not match this job' });
    }
    const existing = (job.quotes || []).some(
      (q) => q.professionalId && q.professionalId.toString() === req.user.id
    );
    if (existing) return res.status(400).json({ error: 'You have already submitted a quote for this job' });

    const { price, deliveryTime, message } = req.body;
    if (price == null || isNaN(Number(price)) || Number(price) < 0) {
      return res.status(400).json({ error: 'Valid price is required' });
    }
    if (!deliveryTime || !String(deliveryTime).trim()) {
      return res.status(400).json({ error: 'Delivery time is required' });
    }

    // Optional suggested milestones from professional
    const rawSuggested = Array.isArray(req.body.suggestedMilestones) ? req.body.suggestedMilestones : [];
    const suggestedMilestones = rawSuggested
      .map((item) => {
        const amount =
          item && item.amount != null && !isNaN(Number(item.amount)) ? Number(item.amount) : null;
        const description =
          item && typeof item.description === 'string' ? item.description.trim() : '';
        if (!amount || amount <= 0 || !description) {
          return null;
        }
        return { description, amount, status: 'pending' };
      })
      .filter(Boolean);

    const professionalName =
      fullUser?.tradingName || [fullUser?.firstName, fullUser?.lastName].filter(Boolean).join(' ') || 'Professional';

    let rating = 0;
    let reviewCount = 0;
    try {
      const agg = await Review.aggregate([
        { $match: { professional: new mongoose.Types.ObjectId(req.user.id) } },
        { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
      ]);
      if (agg[0]) {
        rating = agg[0].avg || 0;
        reviewCount = agg[0].count || 0;
      }
    } catch (_) {}

    job.quotes = job.quotes || [];
    job.quotes.push({
      professionalId: req.user.id,
      professionalName,
      professionalAvatar: fullUser?.avatar || undefined,
      professionalRating: rating,
      professionalReviews: reviewCount,
      price: Number(price),
      deliveryTime: String(deliveryTime).trim(),
      message: message ? String(message).trim() : '',
      status: 'pending',
      suggestedMilestones,
    });
    job.markModified('quotes');
    await job.save();
    emitJobUpdated(job);
    res.status(201).json(toJobResponse(job));
  } catch (err) {
    console.error('[Jobs] Submit quote error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit quote' });
  }
});

// Withdraw quote (professional only: remove own quote when pending)
router.delete('/:id/quotes/:quoteId', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const quote = (job.quotes || []).find((q) => q._id.toString() === req.params.quoteId);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    if (quote.professionalId && quote.professionalId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only withdraw your own quote' });
    }
    if (quote.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending quotes can be withdrawn' });
    }
    job.quotes = (job.quotes || []).filter((q) => q._id.toString() !== req.params.quoteId);
    job.markModified('quotes');
    await job.save();
    emitJobUpdated(job);
    return res.json(toJobResponse(job));
  } catch (err) {
    console.error('[Jobs] Withdraw quote error:', err);
    res.status(500).json({ error: err.message || 'Failed to withdraw quote' });
  }
});

// Update quote body by professional (price, deliveryTime, message; only when pending)
router.put('/:id/quotes/:quoteId', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const quote = (job.quotes || []).find((q) => q._id.toString() === req.params.quoteId);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    if (quote.professionalId && quote.professionalId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You can only update your own quote' });
    }
    if (quote.status !== 'pending') {
      return res.status(400).json({ error: 'Only pending quotes can be updated' });
    }
    const { price, deliveryTime, message } = req.body;
    if (price != null && !isNaN(Number(price)) && Number(price) >= 0) {
      quote.price = Number(price);
    }
    if (deliveryTime != null && String(deliveryTime).trim()) {
      quote.deliveryTime = String(deliveryTime).trim();
    }
    if (message !== undefined) {
      quote.message = message ? String(message).trim() : '';
    }
    job.markModified('quotes');
    await job.save();
    emitJobUpdated(job);
    return res.json(toJobResponse(job));
  } catch (err) {
    console.error('[Jobs] Update quote by professional error:', err);
    res.status(500).json({ error: err.message || 'Failed to update quote' });
  }
});

// Update quote status (client owner: accept / reject / award)
router.patch('/:id/quotes/:quoteId', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.clientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed to update quotes for this job' });
    }
    const { status, milestoneAmount, milestoneDescription } = req.body;
    if (!['accepted', 'rejected', 'awarded'].includes(status)) {
      return res.status(400).json({ error: 'Status must be accepted, rejected, or awarded' });
    }
    const quote = (job.quotes || []).find((q) => q._id.toString() === req.params.quoteId);
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    if (quote.status !== 'pending') {
      return res.status(400).json({ error: 'Quote is no longer pending' });
    }

    if (status === 'awarded') {
      quote.status = 'awarded';
      job.status = 'awaiting-accept';
      job.awardedProfessionalId = quote.professionalId;
      (job.quotes || []).forEach((q) => {
        if (q._id.toString() !== req.params.quoteId) q.status = 'rejected';
      });
      const milestonesPayload = Array.isArray(req.body.milestones) ? req.body.milestones : null;
      let totalMilestoneAmount = 0;
      if (milestonesPayload && milestonesPayload.length > 0) {
        for (const item of milestonesPayload) {
          const amount = item.amount != null && !isNaN(Number(item.amount)) ? Number(item.amount) : 0;
          if (amount > 0) totalMilestoneAmount += amount;
        }
      } else {
        const amount = req.body.milestoneAmount != null && !isNaN(Number(req.body.milestoneAmount)) ? Number(req.body.milestoneAmount) : null;
        if (amount != null && amount >= 0) totalMilestoneAmount = amount;
      }

      if (totalMilestoneAmount > 0) {
        const client = await User.findById(job.clientId).select('walletBalance');
        if (!client) return res.status(400).json({ error: 'Client not found' });
        const currentBalance = client.walletBalance || 0;
        if (currentBalance < totalMilestoneAmount) {
          return res.status(400).json({
            error: 'Insufficient wallet balance',
            code: 'INSUFFICIENT_BALANCE',
            required: totalMilestoneAmount,
            current: currentBalance,
          });
        }
        client.walletBalance = currentBalance - totalMilestoneAmount;
        await client.save();
        await Wallet.create({
          userId: job.clientId,
          type: 'payment',
          amount: totalMilestoneAmount,
          balance: client.walletBalance,
          status: 'completed',
          paymentMethod: 'wallet',
          description: `Job milestones - ${job.title || 'Job'}`,
          metadata: { jobId: job._id.toString(), source: 'job_milestones' },
        });
      }

      if (milestonesPayload && milestonesPayload.length > 0) {
        job.milestones = job.milestones || [];
        for (const item of milestonesPayload) {
          const name = item.name && String(item.name).trim() ? String(item.name).trim() : 'Milestone';
          const desc = item.description && String(item.description).trim() ? String(item.description).trim() : name;
          const amount = item.amount != null && !isNaN(Number(item.amount)) ? Number(item.amount) : 0;
          if (amount < 0) continue;
          job.milestones.push({
            name,
            description: desc,
            amount,
            status: 'awaiting-accept',
          });
        }
        job.markModified('milestones');
      } else if (totalMilestoneAmount > 0) {
        const amount = req.body.milestoneAmount != null && !isNaN(Number(req.body.milestoneAmount)) ? Number(req.body.milestoneAmount) : null;
        if (amount != null && amount >= 0) {
          job.milestones = job.milestones || [];
          job.milestones.push({
            name: (req.body.milestoneName && String(req.body.milestoneName).trim()) || 'Milestone payment',
            description: (req.body.milestoneDescription && String(req.body.milestoneDescription).trim()) || 'Milestone payment',
            amount,
            status: 'awaiting-accept',
          });
          job.markModified('milestones');
        }
      }
    } else {
      quote.status = status;
      if (status === 'accepted') {
        job.status = 'in-progress';
        job.awardedProfessionalId = quote.professionalId;
        (job.quotes || []).forEach((q) => {
          if (q._id.toString() !== req.params.quoteId) q.status = 'rejected';
        });
      }
    }

    job.markModified('quotes');
    await job.save();
    emitJobUpdated(job);
    res.json(toJobResponse(job));
  } catch (err) {
    console.error('[Jobs] Update quote error:', err);
    res.status(500).json({ error: err.message || 'Failed to update quote' });
  }
});

// Client: accept a single suggested milestone from the awarded quote -> create real funded milestone
router.post(
  '/:id/quotes/:quoteId/suggested-milestones/:suggestedId/accept',
  authenticateToken,
  requireRole(['client']),
  async (req, res) => {
    try {
      const job = await Job.findById(req.params.id);
      if (!job) return res.status(404).json({ error: 'Job not found' });
      if (job.clientId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not allowed to update this job' });
      }
      if (!['awaiting-accept', 'in-progress'].includes(job.status)) {
        return res
          .status(400)
          .json({ error: 'Cannot accept suggested milestones in current job status' });
      }

      const quote = (job.quotes || []).find((q) => q._id.toString() === req.params.quoteId);
      if (!quote) return res.status(404).json({ error: 'Quote not found' });

      // Only allow accepting milestones from the awarded professional
      if (
        !job.awardedProfessionalId ||
        !quote.professionalId ||
        quote.professionalId.toString() !== job.awardedProfessionalId.toString()
      ) {
        return res.status(400).json({ error: 'Suggested milestones can only be accepted for awarded quote' });
      }

      const suggested =
        (quote.suggestedMilestones || []).find((m) => m._id.toString() === req.params.suggestedId) ||
        null;
      if (!suggested) {
        return res.status(404).json({ error: 'Suggested milestone not found' });
      }
      if (suggested.status === 'accepted') {
        return res.status(400).json({ error: 'Suggested milestone is already accepted' });
      }
      if (suggested.status === 'rejected') {
        return res.status(400).json({ error: 'Suggested milestone has been rejected' });
      }

      const numAmount = suggested.amount != null && !isNaN(Number(suggested.amount))
        ? Number(suggested.amount)
        : null;
      if (numAmount == null || numAmount <= 0) {
        return res.status(400).json({ error: 'Suggested milestone amount is invalid' });
      }

      const description =
        (suggested.description && String(suggested.description).trim()) || 'Milestone';

      // Wallet balance check and deduction (same behaviour as creating a normal milestone)
      const client = await User.findById(job.clientId).select('walletBalance');
      if (!client) return res.status(400).json({ error: 'Client not found' });
      const currentBalance = client.walletBalance || 0;
      if (currentBalance < numAmount) {
        return res.status(400).json({
          error: 'Insufficient wallet balance',
          code: 'INSUFFICIENT_BALANCE',
          required: numAmount,
          current: currentBalance,
        });
      }
      client.walletBalance = currentBalance - numAmount;
      await client.save();
      await Wallet.create({
        userId: job.clientId,
        type: 'payment',
        amount: numAmount,
        balance: client.walletBalance,
        status: 'completed',
        paymentMethod: 'wallet',
        description: `Job milestone - ${job.title || 'Job'} - ${description}`,
        metadata: { jobId: job._id.toString(), source: 'job_suggested_milestone' },
      });

      job.milestones = job.milestones || [];
      const newMilestoneStatus = job.status === 'in-progress' ? 'in-progress' : 'awaiting-accept';
      job.milestones.push({
        name: description,
        description,
        amount: numAmount,
        status: newMilestoneStatus,
      });

      suggested.status = 'accepted';
      job.markModified('milestones');
      job.markModified('quotes');
      await job.save();
      emitJobUpdated(job);
      return res.json(toJobResponse(job));
    } catch (err) {
      console.error('[Jobs] Accept suggested milestone error:', err);
      return res
        .status(500)
        .json({ error: err.message || 'Failed to accept suggested milestone' });
    }
  }
);

// Client: reject a suggested milestone from the awarded quote
router.post(
  '/:id/quotes/:quoteId/suggested-milestones/:suggestedId/reject',
  authenticateToken,
  requireRole(['client']),
  async (req, res) => {
    try {
      const job = await Job.findById(req.params.id);
      if (!job) return res.status(404).json({ error: 'Job not found' });
      if (job.clientId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not allowed to update this job' });
      }

      const quote = (job.quotes || []).find((q) => q._id.toString() === req.params.quoteId);
      if (!quote) return res.status(404).json({ error: 'Quote not found' });

      const suggested =
        (quote.suggestedMilestones || []).find((m) => m._id.toString() === req.params.suggestedId) ||
        null;
      if (!suggested) {
        return res.status(404).json({ error: 'Suggested milestone not found' });
      }
      if (suggested.status === 'accepted') {
        return res.status(400).json({ error: 'Suggested milestone is already accepted' });
      }
      if (suggested.status === 'rejected') {
        return res.status(400).json({ error: 'Suggested milestone is already rejected' });
      }

      suggested.status = 'rejected';
      job.markModified('quotes');
      await job.save();
      emitJobUpdated(job);
      return res.json(toJobResponse(job));
    } catch (err) {
      console.error('[Jobs] Reject suggested milestone error:', err);
      return res
        .status(500)
        .json({ error: err.message || 'Failed to reject suggested milestone' });
    }
  }
);

// Professional: accept job award (job moves to in-progress, milestones to in-progress)
router.post('/:id/accept-award', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'awaiting-accept') {
      return res.status(400).json({ error: 'Job is not awaiting acceptance' });
    }
    if (!job.awardedProfessionalId || job.awardedProfessionalId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You are not the awarded professional for this job' });
    }
    job.status = 'in-progress';
    const awardedQuote = (job.quotes || []).find(
      (q) => q.professionalId && q.professionalId.toString() === req.user.id
    );
    if (awardedQuote) awardedQuote.status = 'accepted';
    (job.milestones || []).forEach((m) => {
      if (m.status === 'awaiting-accept') m.status = 'in-progress';
    });
    job.markModified('quotes');
    job.markModified('milestones');
    await job.save();
    emitJobUpdated(job);
    res.json(toJobResponse(job));
  } catch (err) {
    console.error('[Jobs] Accept award error:', err);
    res.status(500).json({ error: err.message || 'Failed to accept award' });
  }
});

// Professional: reject job award (job back to active, clear awarded pro)
router.post('/:id/reject-award', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.status !== 'awaiting-accept') {
      return res.status(400).json({ error: 'Job is not awaiting acceptance' });
    }
    if (!job.awardedProfessionalId || job.awardedProfessionalId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'You are not the awarded professional for this job' });
    }
    const refundTotal = (job.milestones || []).reduce((sum, m) => sum + (m.amount || 0), 0);
    if (refundTotal > 0) {
      const client = await User.findById(job.clientId).select('walletBalance');
      if (client) {
        client.walletBalance = (client.walletBalance || 0) + refundTotal;
        await client.save();
        await Wallet.create({
          userId: job.clientId,
          type: 'refund',
          amount: refundTotal,
          balance: client.walletBalance,
          status: 'completed',
          paymentMethod: 'wallet',
          description: `Job award rejected - refund - ${job.title || 'Job'}`,
          metadata: { jobId: job._id.toString(), source: 'job_award_rejected' },
        });
      }
    }
    job.status = 'open';
    job.awardedProfessionalId = null;
    const awardedQuote = (job.quotes || []).find(
      (q) => q.professionalId && q.professionalId.toString() === req.user.id
    );
    // Revert quote to pending so client can re-award or message
    if (awardedQuote) awardedQuote.status = 'pending';
    job.milestones = [];
    job.markModified('quotes');
    job.markModified('milestones');
    await job.save();
    emitJobUpdated(job);
    res.json(toJobResponse(job));
  } catch (err) {
    console.error('[Jobs] Reject award error:', err);
    res.status(500).json({ error: err.message || 'Failed to reject award' });
  }
});

// Client: add milestone (only when job is awaiting-accept or in-progress); deduct from wallet
router.post('/:id/milestones', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.clientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed to add milestones for this job' });
    }
    if (!['awaiting-accept', 'in-progress'].includes(job.status)) {
      return res.status(400).json({ error: 'Cannot add milestones in current job status' });
    }
    const { description, amount, name } = req.body;
    const milestoneName = (name && String(name).trim()) || (description && String(description).trim()) || 'Milestone';
    if (!milestoneName) {
      return res.status(400).json({ error: 'Name or description is required' });
    }
    const numAmount = amount != null && !isNaN(Number(amount)) ? Number(amount) : null;
    if (numAmount == null || numAmount < 0) {
      return res.status(400).json({ error: 'Valid amount is required' });
    }

    const client = await User.findById(job.clientId).select('walletBalance');
    if (!client) return res.status(400).json({ error: 'Client not found' });
    const currentBalance = client.walletBalance || 0;
    if (currentBalance < numAmount) {
      return res.status(400).json({
        error: 'Insufficient wallet balance',
        code: 'INSUFFICIENT_BALANCE',
        required: numAmount,
        current: currentBalance,
      });
    }
    client.walletBalance = currentBalance - numAmount;
    await client.save();
    await Wallet.create({
      userId: job.clientId,
      type: 'payment',
      amount: numAmount,
      balance: client.walletBalance,
      status: 'completed',
      paymentMethod: 'wallet',
      description: `Job milestone - ${job.title || 'Job'} - ${milestoneName}`,
      metadata: { jobId: job._id.toString(), source: 'job_milestone' },
    });

    job.milestones = job.milestones || [];
    const newMilestoneStatus = job.status === 'in-progress' ? 'in-progress' : 'awaiting-accept';
    job.milestones.push({
      name: milestoneName,
      description: String(description || name || milestoneName).trim(),
      amount: numAmount,
      status: newMilestoneStatus,
    });
    job.markModified('milestones');
    await job.save();
    emitJobUpdated(job);
    res.status(201).json(toJobResponse(job));
  } catch (err) {
    console.error('[Jobs] Add milestone error:', err);
    res.status(500).json({ error: err.message || 'Failed to add milestone' });
  }
});

// Client: release milestone or update status (e.g. release)
router.patch('/:id/milestones/:milestoneId', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.clientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed to update milestones for this job' });
    }
    const { status } = req.body;
    if (status !== 'released') {
      return res.status(400).json({ error: 'Only release is supported' });
    }
    const milestone = (job.milestones || []).find((m) => m._id.toString() === req.params.milestoneId);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
    if (milestone.status !== 'in-progress') {
      return res.status(400).json({ error: 'Only in-progress milestones can be released' });
    }
    const amount = Number(milestone.amount) || 0;
    const professionalId = job.awardedProfessionalId;
    if (amount > 0 && professionalId) {
      const professional = await User.findById(professionalId).select('walletBalance');
      if (professional) {
        professional.walletBalance = (professional.walletBalance || 0) + amount;
        await professional.save();
        const milestoneName = milestone.name || milestone.description || 'Milestone';
        await Wallet.create({
          userId: professional._id,
          type: 'deposit',
          amount,
          balance: professional.walletBalance,
          status: 'completed',
          paymentMethod: 'wallet',
          description: `Job milestone release - ${job.title || 'Job'} - ${milestoneName}`,
          jobId: job._id,
          milestoneId: milestone._id.toString(),
          metadata: {
            source: 'job_milestone_release',
            jobSlug: job.slug || job._id.toString(),
            jobTitle: job.title || 'Job',
            milestoneName,
            releasedBy: req.user.id,
          },
        });
      }
    }
    milestone.status = 'released';
    milestone.releasedAt = new Date();
    job.markModified('milestones');
    const totalMilestones = (job.milestones || []).reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
    const totalReleased = (job.milestones || []).filter((m) => m.status === 'released').reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
    if (totalMilestones > 0 && totalReleased >= totalMilestones) {
      job.status = 'completed';
    }
    await job.save();
    emitJobUpdated(job);
    res.json(toJobResponse(job));
  } catch (err) {
    console.error('[Jobs] Release milestone error:', err);
    res.status(500).json({ error: err.message || 'Failed to release milestone' });
  }
});

// Client: close/delete milestone (only when awaiting-accept); refund to wallet
router.delete('/:id/milestones/:milestoneId', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.clientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed to delete milestones for this job' });
    }
    const milestone = (job.milestones || []).find((m) => m._id.toString() === req.params.milestoneId);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
    if (milestone.status !== 'awaiting-accept') {
      return res.status(400).json({ error: 'Only awaiting-accept milestones can be closed' });
    }
    const refundAmount = milestone.amount || 0;
    if (refundAmount > 0) {
      const client = await User.findById(job.clientId).select('walletBalance');
      if (client) {
        client.walletBalance = (client.walletBalance || 0) + refundAmount;
        await client.save();
        await Wallet.create({
          userId: job.clientId,
          type: 'refund',
          amount: refundAmount,
          balance: client.walletBalance,
          status: 'completed',
          paymentMethod: 'wallet',
          description: `Milestone closed (refund) - ${job.title || 'Job'} - ${milestone.name || 'Milestone'}`,
          metadata: { jobId: job._id.toString(), milestoneId: req.params.milestoneId, source: 'job_milestone_close' },
        });
      }
    }
    job.milestones = (job.milestones || []).filter((m) => m._id.toString() !== req.params.milestoneId);
    job.markModified('milestones');
    await job.save();
    emitJobUpdated(job);
    res.json(toJobResponse(job));
  } catch (err) {
    console.error('[Jobs] Delete milestone error:', err);
    res.status(500).json({ error: err.message || 'Failed to delete milestone' });
  }
});

// Client or Professional: request to cancel a milestone (in-progress only; other party can respond)
router.post('/:id/milestones/:milestoneId/request-cancel', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const isClient = job.clientId.toString() === req.user.id;
    const isPro = job.awardedProfessionalId && job.awardedProfessionalId.toString() === req.user.id;
    if (!isClient && !isPro) {
      return res.status(403).json({ error: 'Not allowed to request cancel for this job' });
    }
    const milestone = (job.milestones || []).find((m) => m._id.toString() === req.params.milestoneId);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
    if (milestone.status !== 'in-progress' && milestone.status !== 'awaiting-accept') {
      return res.status(400).json({ error: 'Only in-progress or awaiting-accept milestones can have a cancel request' });
    }
    if (milestone.cancelRequestStatus === 'pending') {
      return res.status(400).json({ error: 'A cancel request is already pending' });
    }
    const { reason } = req.body;
    milestone.cancelRequestedAt = new Date();
    milestone.cancelRequestedBy = req.user.id;
    milestone.cancelRequestReason = reason ? String(reason).trim() : '';
    milestone.cancelRequestStatus = 'pending';
    job.markModified('milestones');
    await job.save();
    emitJobUpdated(job);
    res.json(toJobResponse(job));
  } catch (err) {
    console.error('[Jobs] Request cancel error:', err);
    res.status(500).json({ error: err.message || 'Failed to request cancel' });
  }
});

// Client or Professional: respond to cancel request (accept -> set milestone to cancelled; reject -> clear cancel request)
router.patch('/:id/milestones/:milestoneId/respond-cancel', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const isClient = job.clientId.toString() === req.user.id;
    const isPro = job.awardedProfessionalId && job.awardedProfessionalId.toString() === req.user.id;
    if (!isClient && !isPro) {
      return res.status(403).json({ error: 'Not allowed to respond to cancel for this job' });
    }
    const milestone = (job.milestones || []).find((m) => m._id.toString() === req.params.milestoneId);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
    if (milestone.cancelRequestStatus !== 'pending') {
      return res.status(400).json({ error: 'No pending cancel request' });
    }
    const requestedBy = milestone.cancelRequestedBy ? milestone.cancelRequestedBy.toString() : null;
    if (requestedBy === req.user.id) {
      return res.status(400).json({ error: 'You cannot respond to your own cancel request' });
    }
    const { accept } = req.body;
    if (accept === true) {
      milestone.status = 'cancelled';
      milestone.cancelRequestStatus = 'accepted';
    } else {
      milestone.cancelRequestStatus = 'rejected';
      milestone.cancelRequestedAt = null;
      milestone.cancelRequestedBy = null;
      milestone.cancelRequestReason = null;
    }
    job.markModified('milestones');
    await job.save();
    emitJobUpdated(job);
    res.json(toJobResponse(job));
  } catch (err) {
    console.error('[Jobs] Respond cancel error:', err);
    res.status(500).json({ error: err.message || 'Failed to respond to cancel request' });
  }
});

// Professional: request client to release milestone
router.post('/:id/milestones/:milestoneId/request-release', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.awardedProfessionalId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed to request release for this job' });
    }
    const milestone = (job.milestones || []).find((m) => m._id.toString() === req.params.milestoneId);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
    if (milestone.status !== 'in-progress') {
      return res.status(400).json({ error: 'Only in-progress milestones can have a release request' });
    }
    if (milestone.releaseRequestStatus === 'pending') {
      return res.status(400).json({ error: 'A release request is already pending' });
    }
    milestone.releaseRequestedAt = new Date();
    milestone.releaseRequestedBy = req.user.id;
    milestone.releaseRequestStatus = 'pending';
    job.markModified('milestones');
    await job.save();
    emitJobUpdated(job);
    res.json(toJobResponse(job));
  } catch (err) {
    console.error('[Jobs] Request release error:', err);
    res.status(500).json({ error: err.message || 'Failed to request release' });
  }
});

// Client: respond to release request (accept -> release milestone; reject -> clear release request)
router.patch('/:id/milestones/:milestoneId/respond-release', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.clientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed to respond to release for this job' });
    }
    const milestone = (job.milestones || []).find((m) => m._id.toString() === req.params.milestoneId);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
    if (milestone.releaseRequestStatus !== 'pending') {
      return res.status(400).json({ error: 'No pending release request' });
    }
    const { accept } = req.body;
    if (accept === true) {
      const amount = Number(milestone.amount) || 0;
      const professionalId = job.awardedProfessionalId;
      if (amount > 0 && professionalId) {
        const professional = await User.findById(professionalId).select('walletBalance');
        if (professional) {
          professional.walletBalance = (professional.walletBalance || 0) + amount;
          await professional.save();
          const milestoneName = milestone.name || milestone.description || 'Milestone';
          await Wallet.create({
            userId: professional._id,
            type: 'deposit',
            amount,
            balance: professional.walletBalance,
            status: 'completed',
            paymentMethod: 'wallet',
            description: `Job milestone release - ${job.title || 'Job'} - ${milestoneName}`,
            jobId: job._id,
            milestoneId: milestone._id.toString(),
            metadata: {
              source: 'job_milestone_release',
              jobSlug: job.slug || job._id.toString(),
              jobTitle: job.title || 'Job',
              milestoneName,
              releasedBy: req.user.id,
            },
          });
        }
      }
      milestone.status = 'released';
      milestone.releasedAt = new Date();
      milestone.releaseRequestStatus = 'accepted';
      milestone.releaseRequestedAt = null;
      milestone.releaseRequestedBy = null;
    } else {
      milestone.releaseRequestStatus = 'rejected';
      milestone.releaseRequestedAt = null;
      milestone.releaseRequestedBy = null;
    }
    job.markModified('milestones');
    const totalMilestones = (job.milestones || []).reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
    const totalReleased = (job.milestones || []).filter((m) => m.status === 'released').reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
    if (totalMilestones > 0 && totalReleased >= totalMilestones) {
      job.status = 'completed';
    }
    await job.save();
    emitJobUpdated(job);
    res.json(toJobResponse(job));
  } catch (err) {
    console.error('[Jobs] Respond release error:', err);
    res.status(500).json({ error: err.message || 'Failed to respond to release request' });
  }
});

// Create job dispute (client or professional)
router.post('/:id/disputes', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const isClient = job.clientId.toString() === req.user.id;
    const isPro = job.awardedProfessionalId && job.awardedProfessionalId.toString() === req.user.id;
    if (!isClient && !isPro) {
      return res.status(403).json({ error: 'Not allowed to create dispute for this job' });
    }
    const { milestoneId, reason, evidence } = req.body;
    if (!milestoneId || !reason || !String(reason).trim()) {
      return res.status(400).json({ error: 'milestoneId and reason are required' });
    }
    const milestone = (job.milestones || []).find((m) => m._id.toString() === milestoneId);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
    if (milestone.status === 'disputed' && milestone.disputeId) {
      return res.status(400).json({ error: 'This milestone already has an open dispute' });
    }
    if (milestone.status === 'awaiting-accept' || milestone.status === 'released' || milestone.status === 'cancelled') {
      return res.status(400).json({ error: 'Cannot open dispute for this milestone status' });
    }
    const claimantId = req.user.id;
    const respondentId = isClient ? job.awardedProfessionalId : job.clientId;
    if (!respondentId) return res.status(400).json({ error: 'Respondent not found' });

    const dispute = new JobDispute({
      jobId: job._id,
      milestoneId: milestone._id,
      createdBy: claimantId,
      claimantId,
      respondentId,
      reason: String(reason).trim(),
      evidence: evidence ? String(evidence).trim() : null,
      status: 'open',
    });
    await dispute.save();

    milestone.status = 'disputed';
    milestone.disputeId = dispute._id;
    job.markModified('milestones');
    await job.save();
    emitJobUpdated(job);

    const jobRes = toJobResponse(job);
    const disputeRes = {
      id: dispute._id.toString(),
      jobId: job._id.toString(),
      milestoneId: milestone._id.toString(),
      claimantId: dispute.claimantId.toString(),
      respondentId: dispute.respondentId.toString(),
      reason: dispute.reason,
      evidence: dispute.evidence || undefined,
      status: dispute.status,
      messages: (dispute.messages || []).map((msg) => ({
        id: msg._id.toString(),
        userId: msg.userId?.toString(),
        userName: msg.userName,
        message: msg.message,
        timestamp: msg.timestamp ? new Date(msg.timestamp).toISOString() : null,
        isTeamResponse: msg.isTeamResponse,
      })),
      createdAt: dispute.createdAt ? new Date(dispute.createdAt).toISOString() : null,
    };
    res.status(201).json({ job: jobRes, dispute: disputeRes });
  } catch (err) {
    console.error('[Jobs] Create dispute error:', err);
    res.status(500).json({ error: err.message || 'Failed to create dispute' });
  }
});

// List disputes for a job
router.get('/:id/disputes', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const isClient = job.clientId.toString() === req.user.id;
    const isPro = job.awardedProfessionalId && job.awardedProfessionalId.toString() === req.user.id;
    if (!isClient && !isPro) {
      return res.status(403).json({ error: 'Not allowed to view disputes for this job' });
    }
    const disputes = await JobDispute.find({ jobId: job._id }).sort({ createdAt: -1 }).lean();
    const list = disputes.map((d) => ({
      id: d._id.toString(),
      jobId: d.jobId.toString(),
      milestoneId: d.milestoneId.toString(),
      claimantId: d.claimantId?.toString(),
      respondentId: d.respondentId?.toString(),
      reason: d.reason,
      evidence: d.evidence || undefined,
      status: d.status,
      messages: (d.messages || []).map((m) => ({
        id: m._id?.toString(),
        userId: m.userId?.toString(),
        userName: m.userName,
        message: m.message,
        timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : null,
        isTeamResponse: m.isTeamResponse,
      })),
      createdAt: d.createdAt ? new Date(d.createdAt).toISOString() : null,
    }));
    res.json({ disputes: list });
  } catch (err) {
    console.error('[Jobs] List disputes error:', err);
    res.status(500).json({ error: err.message || 'Failed to list disputes' });
  }
});

// Add message to job dispute
router.post('/:id/disputes/:disputeId/messages', authenticateToken, async (req, res) => {
  try {
    const dispute = await JobDispute.findById(req.params.disputeId);
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
    if (dispute.jobId.toString() !== req.params.id) {
      return res.status(404).json({ error: 'Dispute not found for this job' });
    }
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const isClient = job.clientId.toString() === req.user.id;
    const isPro = job.awardedProfessionalId && job.awardedProfessionalId.toString() === req.user.id;
    if (!isClient && !isPro) {
      return res.status(403).json({ error: 'Not allowed to add message to this dispute' });
    }
    const { message } = req.body;
    if (!message || !String(message).trim()) {
      return res.status(400).json({ error: 'Message is required' });
    }
    const user = await User.findById(req.user.id).select('firstName lastName tradingName avatar').lean();
    const userName = user?.tradingName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
    dispute.messages = dispute.messages || [];
    dispute.messages.push({
      userId: req.user.id,
      userName,
      userAvatar: user?.avatar || '',
      message: String(message).trim(),
      timestamp: new Date(),
      isTeamResponse: false,
    });
    dispute.markModified('messages');
    await dispute.save();
    const updated = await JobDispute.findById(dispute._id).lean();
    const disputeRes = {
      id: updated._id.toString(),
      messages: (updated.messages || []).map((m) => ({
        id: m._id?.toString(),
        userId: m.userId?.toString(),
        userName: m.userName,
        message: m.message,
        timestamp: m.timestamp ? new Date(m.timestamp).toISOString() : null,
        isTeamResponse: m.isTeamResponse,
      })),
    };
    res.json(disputeRes);
  } catch (err) {
    console.error('[Jobs] Add dispute message error:', err);
    res.status(500).json({ error: err.message || 'Failed to add message' });
  }
});

// Milestone invoice PDF (client: any milestone; pro: only when released)
router.get('/:id/milestones/:milestoneId/invoice', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id)
      .populate('clientId', 'firstName lastName address postcode townCity county')
      .populate('awardedProfessionalId', 'firstName lastName');
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const isClient = job.clientId && job.clientId._id.toString() === req.user.id;
    const isPro = job.awardedProfessionalId && job.awardedProfessionalId._id.toString() === req.user.id;
    if (!isClient && !isPro) return res.status(403).json({ error: 'Not allowed to view this invoice' });
    const milestone = (job.milestones || []).find((m) => m._id.toString() === req.params.milestoneId);
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
    if (isPro && milestone.status !== 'released') {
      return res.status(403).json({ error: 'Invoice is available after the milestone is released' });
    }

    const clientName = job.clientId
      ? [job.clientId.firstName, job.clientId.lastName].filter(Boolean).join(' ') || 'Client'
      : 'Client';
    const clientAddressParts = job.clientId
      ? [job.clientId.address, job.clientId.townCity, job.clientId.county, job.clientId.postcode].filter(Boolean)
      : [];
    const clientAddress = clientAddressParts.length > 0 ? clientAddressParts.join(', ') : '';
    const proName = job.awardedProfessionalId
      ? [job.awardedProfessionalId.firstName, job.awardedProfessionalId.lastName].filter(Boolean).join(' ') || 'Professional'
      : 'Professional';
    const jobTitle = job.title || 'Job';
    const milestoneName = milestone.name || milestone.description || 'Milestone';
    const amount = Number(milestone.amount) || 0;
    const invoiceNumber = `INV-${(job.slug || job._id.toString()).slice(-8)}-${milestone._id.toString().slice(-6)}`;
    const invoiceDate = (milestone.releasedAt ? new Date(milestone.releasedAt) : new Date()).toLocaleDateString('en-GB', {
      day: '2-digit', month: 'short', year: 'numeric',
    });

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `inline; filename="invoice-${invoiceNumber}.pdf"`);

    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    doc.pipe(res);

    // Logo area – top left (placeholder: site name / logo)
    doc.fontSize(18).font('Helvetica-Bold').fillColor('#1a1a2e');
    doc.text('Sortars.com', 50, 50);
    doc.moveDown(0.5);

    // Right side: Invoice title and number
    doc.fontSize(24).font('Helvetica-Bold').fillColor('#2c353f');
    doc.text('INVOICE', 400, 50, { width: 150, align: 'right' });
    doc.fontSize(10).font('Helvetica').fillColor('#6b6b6b');
    doc.text(`Invoice # ${invoiceNumber}`, 400, 78, { width: 150, align: 'right' });
    doc.text(`Date: ${invoiceDate}`, 400, 92, { width: 150, align: 'right' });

    let y = 120;

    // Bill To / From section (ecommerce style)
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c353f');
    doc.text('Bill To', 50, y);
    doc.font('Helvetica').fillColor('#333');
    doc.text(clientName, 50, y + 14);
    if (clientAddress) doc.text(clientAddress, 50, y + 28, { width: 260 });

    doc.font('Helvetica-Bold').fillColor('#2c353f');
    doc.text('Service Provider', 320, y);
    doc.font('Helvetica').fillColor('#333');
    doc.text(proName, 320, y + 14);
    y += 60;

    // Line
    doc.strokeColor('#e0e0e0').lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
    y += 20;

    // Table header
    doc.fontSize(10).font('Helvetica-Bold').fillColor('#2c353f');
    doc.text('Description', 50, y);
    doc.text('Amount', 450, y, { width: 95, align: 'right' });
    y += 22;
    doc.strokeColor('#e0e0e0').lineWidth(0.3).moveTo(50, y).lineTo(545, y).stroke();
    y += 12;

    // Milestone line – description: Job title (Milestone name)
    doc.font('Helvetica').fillColor('#333');
    doc.text(`${jobTitle} (${milestoneName})`, 50, y, { width: 390 });
    doc.text(`£${amount.toFixed(2)}`, 450, y, { width: 95, align: 'right' });
    y += 24;

    doc.strokeColor('#e0e0e0').lineWidth(0.5).moveTo(50, y).lineTo(545, y).stroke();
    y += 16;

    // Total
    doc.font('Helvetica-Bold').fillColor('#2c353f');
    doc.text('Total', 50, y);
    doc.text(`£${amount.toFixed(2)}`, 450, y, { width: 95, align: 'right' });
    y += 30;

    doc.font('Helvetica').fontSize(9).fillColor('#6b6b6b');
    doc.text(
      'This invoice relates to the milestone payment for the job listed above. Thank you for your business.',
      50,
      y,
      { width: 495, align: 'left' }
    );

    doc.end();
  } catch (err) {
    console.error('[Jobs] Invoice PDF error:', err);
    if (!res.headersSent) res.status(500).json({ error: err.message || 'Failed to generate invoice' });
  }
});

export default router;
