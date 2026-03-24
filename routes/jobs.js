import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { createRequire } from 'module';
import { authenticateToken, requireRole } from '../middleware/auth.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const requirePdf = createRequire(import.meta.url);
const PDFDocument = requirePdf('pdfkit');
import Job, { slugify, randomDigits } from '../models/Job.js';
import JobBudgetRange from '../models/JobBudgetRange.js';
import User from '../models/User.js';
import Review from '../models/Review.js';
import Sector from '../models/Sector.js';
import JobDispute from '../models/JobDispute.js';
import Wallet from '../models/Wallet.js';
import Notification from '../models/Notification.js';
import JobReport from '../models/JobReport.js';
import JobDraft from '../models/JobDraft.js';
import JobFile from '../models/JobFile.js';
import PaymentSettings from '../models/PaymentSettings.js';
import Stripe from 'stripe';
import paypal from '@paypal/checkout-server-sdk';
import { getIO } from '../services/socket.js';
import { deductBid } from './bids.js';
import QuoteCreditUsage from '../models/QuoteCreditUsage.js';
import { sendTemplatedEmail } from '../services/notifier.js';
import { revertJobAwardToOpen } from '../services/revertJobAward.js';

const router = express.Router();

function getStripeInstanceForJobs(settings) {
  const isLive = settings?.stripeLiveMode === true;
  const secretKey = isLive
    ? settings?.stripeLiveSecretKey || settings?.stripeSecretKey
    : settings?.stripeTestSecretKey || settings?.stripeSecretKey;
  if (!secretKey) {
    throw new Error('Stripe secret key not configured');
  }
  return new Stripe(secretKey, {
    apiVersion: '2024-12-18.acacia',
  });
}

function getPayPalClientForJobs(settings) {
  const isLive = settings?.paypalLiveMode === true;
  if (isLive) {
    return new paypal.core.LiveEnvironment(
      settings.paypalLiveClientId || settings.paypalClientId || settings.paypalPublicKey,
      settings.paypalLiveSecretKey || settings.paypalSecretKey
    );
  }
  return new paypal.core.SandboxEnvironment(
    settings.paypalSandboxClientId || settings.paypalClientId || settings.paypalPublicKey,
    settings.paypalSandboxSecretKey || settings.paypalSecretKey
  );
}

const clientOrigin = () => process.env.CLIENT_ORIGIN || 'http://localhost:5000';
const jobLink = (job) => `${clientOrigin()}/job/${job.slug || job._id.toString()}`;
const logoUrl = () => process.env.EMAIL_LOGO_URL || '';

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

/**
 * Preferred start date from post-job (`<input type="date">` → "YYYY-MM-DD").
 * Parsed as UTC midnight for that civil date so Mongo round-trips the same YYYY-MM-DD in API responses.
 */
function parseJobSpecificDate(value) {
  if (value == null || value === '') return null;
  const s = String(value).trim();
  if (!s) return null;
  const ymd = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (ymd) {
    const y = parseInt(ymd[1], 10);
    const mo = parseInt(ymd[2], 10);
    const d = parseInt(ymd[3], 10);
    if (mo < 1 || mo > 12 || d < 1 || d > 31) return null;
    const dt = new Date(Date.UTC(y, mo - 1, d));
    if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== mo - 1 || dt.getUTCDate() !== d) return null;
    return dt;
  }
  const dt = new Date(s);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function toIso(value) {
  return value ? new Date(value).toISOString() : undefined;
}

function mapJobDisputeResponse(dispute) {
  return {
    id: dispute._id.toString(),
    jobId: dispute.jobId?.toString?.() || dispute.jobId,
    milestoneId: dispute.milestoneId?.toString?.() || dispute.milestoneId,
    claimantId: dispute.claimantId?.toString?.() || dispute.claimantId,
    respondentId: dispute.respondentId?.toString?.() || dispute.respondentId,
    reason: dispute.reason,
    requirements: dispute.requirements || "",
    unmetRequirements: dispute.unmetRequirements || "",
    evidence: dispute.evidence || undefined,
    evidenceFiles: dispute.evidenceFiles || [],
    status: dispute.status,
    amount: typeof dispute.amount === 'number' ? dispute.amount : 0,
    responseDeadline: toIso(dispute.responseDeadline),
    respondedAt: toIso(dispute.respondedAt),
    negotiationDeadline: toIso(dispute.negotiationDeadline),
    milestoneIndices: Array.isArray(dispute.milestoneIndices) ? dispute.milestoneIndices : undefined,
    clientOffer: dispute.offers?.clientOffer ?? undefined,
    professionalOffer: dispute.offers?.professionalOffer ?? undefined,
    arbitrationRequested: !!dispute.arbitrationRequested,
    arbitrationRequestedAt: toIso(dispute.arbitrationRequestedAt),
    arbitrationFeeAmount: dispute.arbitrationFeeAmount ?? undefined,
    arbitrationFeeDeadline: toIso(dispute.arbitrationFeeDeadline),
    arbitrationPayments: Array.isArray(dispute.arbitrationPayments)
      ? dispute.arbitrationPayments.map((p) => ({
          userId: p.userId?.toString?.() || p.userId,
          amount: p.amount,
          paidAt: toIso(p.paidAt),
          paymentMethod: p.paymentMethod,
          paymentIntentId: p.paymentIntentId || undefined,
          paypalOrderId: p.paypalOrderId || undefined,
          transactionId: p.transactionId?.toString?.() || p.transactionId || undefined,
        }))
      : [],
    acceptedBy: dispute.acceptedBy?.toString?.() || dispute.acceptedBy || undefined,
    acceptedByRole: dispute.acceptedByRole || undefined,
    acceptedAt: toIso(dispute.acceptedAt),
    finalAmount: dispute.finalAmount ?? undefined,
    closedAt: toIso(dispute.closedAt),
    autoClosed: !!dispute.autoClosed,
    winnerId: dispute.winnerId?.toString?.() || dispute.winnerId || undefined,
    loserId: dispute.loserId?.toString?.() || dispute.loserId || undefined,
    decisionNotes: dispute.decisionNotes || undefined,
    messages: (dispute.messages || []).map((msg) => ({
      id: msg._id?.toString?.() || msg.id,
      userId: msg.userId?.toString?.() || msg.userId,
      userName: msg.userName,
      userAvatar: msg.userAvatar,
      message: msg.message,
      timestamp: toIso(msg.timestamp),
      isTeamResponse: !!msg.isTeamResponse,
    })),
    createdAt: toIso(dispute.createdAt),
  };
}

async function applyJobDisputeSettlement({ job, dispute, agreedAmount }) {
  const targetMilestone = (job.milestones || []).find((m) => m._id.toString() === dispute.milestoneId?.toString());
  const totalPaidRaw = Number(targetMilestone?.amount ?? dispute.amount ?? 0);
  const totalPaid = Number.isFinite(totalPaidRaw) ? totalPaidRaw : 0;
  const agreedRaw = Number(agreedAmount ?? 0);
  const normalizedAgreedAmount = Number.isFinite(agreedRaw) ? agreedRaw : 0;
  const payoutAmount = Math.max(0, Math.min(normalizedAgreedAmount, totalPaid));
  const refundAmount = Math.max(0, totalPaid - payoutAmount);
  const milestoneName = targetMilestone?.name || targetMilestone?.description || 'Milestone';
  if (dispute?.metadata?.settlementProcessed) return;

  const client = await User.findById(job.clientId).select('walletBalance');
  const professional = job.awardedProfessionalId
    ? await User.findById(job.awardedProfessionalId).select('walletBalance')
    : null;

  if (client && refundAmount > 0) {
    client.walletBalance = (client.walletBalance || 0) + refundAmount;
    await client.save();
    await Wallet.create({
      userId: client._id,
      type: 'deposit',
      amount: refundAmount,
      balance: client.walletBalance,
      status: 'completed',
      paymentMethod: 'wallet',
      jobId: job._id,
      milestoneId: dispute.milestoneId?.toString(),
      description: `Dispute refund - ${job.title || 'Job'} - ${milestoneName}`,
      metadata: { source: 'job_dispute_settlement_refund', disputeId: dispute._id?.toString() },
    });
  }

  if (professional && payoutAmount > 0) {
    professional.walletBalance = (professional.walletBalance || 0) + payoutAmount;
    await professional.save();
    await Wallet.create({
      userId: professional._id,
      type: 'deposit',
      amount: payoutAmount,
      balance: professional.walletBalance,
      status: 'completed',
      paymentMethod: 'wallet',
      jobId: job._id,
      milestoneId: dispute.milestoneId?.toString(),
      description: `Dispute payout - ${job.title || 'Job'} - ${milestoneName}`,
      metadata: { source: 'job_dispute_settlement_payout', disputeId: dispute._id?.toString() },
    });
  }

  dispute.metadata = dispute.metadata || {};
  dispute.metadata.settlementProcessed = true;
  dispute.metadata.settlementProcessedAt = new Date();
  dispute.metadata.settlementAgreedAmount = payoutAmount;
  dispute.metadata.settlementRefundAmount = refundAmount;
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
    city: job.city,
    state: job.state,
    location: job.location,
    timing: job.timing,
    specificDate: (() => {
      if (!job.specificDate) return undefined;
      const d = new Date(job.specificDate);
      return Number.isNaN(d.getTime()) ? undefined : d.toISOString().split('T')[0];
    })(),
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
      professionalProfileTitle: q.professionalProfileTitle ?? undefined,
      professionalTownCity: q.professionalTownCity ?? undefined,
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
    awardPendingAt: job.awardPendingAt ? new Date(job.awardPendingAt).toISOString() : undefined,
    attachments: (job.attachments || []).map((a) => ({
      name: a.name,
      url: a.url,
      mimeType: a.mimeType || '',
      size: a.size != null ? a.size : 0,
    })),
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
    requestedMilestonePlan: (job.requestedMilestonePlan || []).map((m) => ({
      id: m._id.toString(),
      description: m.description,
      amount: m.amount,
      status: m.status || 'pending',
    })),
    milestoneDeliveries: (job.milestoneDeliveries || []).map((d) => ({
      milestoneIndex: d.milestoneIndex,
      deliveryMessage: d.deliveryMessage || '',
      fileUrls: d.fileUrls || [],
      deliveredAt: d.deliveredAt ? new Date(d.deliveredAt).toISOString() : null,
      deliveredBy: d.deliveredBy?.toString?.() || d.deliveredBy,
      approvedAt: d.approvedAt ? new Date(d.approvedAt).toISOString() : null,
      approvedBy: d.approvedBy?.toString?.() || d.approvedBy || null,
      revisionRequestedAt: d.revisionRequestedAt ? new Date(d.revisionRequestedAt).toISOString() : null,
      revisionMessage: d.revisionMessage || '',
      revisionRequestedBy: d.revisionRequestedBy?.toString?.() || d.revisionRequestedBy || null,
      revisionFileUrls: d.revisionFileUrls || [],
    })),
    clientReviewRating:
      job.clientReviewAt != null && job.clientReviewRating != null
        ? Number(job.clientReviewRating)
        : undefined,
    clientReviewComment: job.clientReviewAt && job.clientReviewComment ? String(job.clientReviewComment) : undefined,
    clientReviewAt: job.clientReviewAt ? new Date(job.clientReviewAt).toISOString() : undefined,
    completedAt: job.completedAt ? new Date(job.completedAt).toISOString() : undefined,
    buyerReview:
      job.buyerReview && job.buyerReview.reviewedAt
        ? {
            rating: job.buyerReview.rating,
            comment: job.buyerReview.comment || '',
            reviewerName: job.buyerReview.reviewerName || '',
            reviewedAt: new Date(job.buyerReview.reviewedAt).toISOString(),
          }
        : undefined,
    professionalResponse: job.professionalReviewResponse ? String(job.professionalReviewResponse) : undefined,
    professionalResponseDate: job.professionalReviewResponseAt
      ? new Date(job.professionalReviewResponseAt).toISOString()
      : undefined,
  };
}

// GET /api/jobs/budget-ranges – public list of price blocks for post-job budget step (no auth)
router.get('/budget-ranges', async (req, res) => {
  try {
    const list = await JobBudgetRange.find().sort({ order: 1, min: 1 }).lean();
    return res.json({
      ranges: list.map((r) => ({
        id: r._id.toString(),
        value: `range-${r._id.toString()}`,
        label: r.max >= 500000 ? `Over £${(r.min / 1000).toFixed(0)}k` : r.min === 0 ? `Under £${r.max}` : `£${r.min.toLocaleString()} - £${r.max.toLocaleString()}`,
        min: r.min,
        max: r.max,
        order: r.order ?? 0,
      })),
    });
  } catch (err) {
    console.error('[Jobs] budget-ranges:', err);
    return res.status(500).json({ error: err.message || 'Failed to load budget ranges' });
  }
});

// Generate job title and description using OpenAI (client only; key points required; sector optional)
// No auth required: used when posting a job without login (user may register at step 6)
router.post('/generate-description', async (req, res) => {
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
1. title: A clear, descriptive job headline that is at least 45 characters long. Expand the headline so it reaches 45 characters or more (e.g. "Install new bathroom suite including taps and toilet" or "Fix leaking kitchen tap and replace washers as needed"). IMPORTANT: The title must be at least 45 characters. Never return a title shorter than 45 characters.
2. description: A full job description - well structured and easy to read. IMPORTANT: Use actual line breaks (newlines) for formatting:
   - Put each section on its own line or block (e.g. "Overview:", "What I need:", "Scope of work:", "Timing/Preferences:").
   - After each section label, start the content on the next line or after a colon and space.
   - Use bullet points as a dash or bullet at the start of a line, with one item per line (e.g. "- Item one\\n- Item two").
   - Separate paragraphs with a blank line (double newline) for clarity.
   Use plain text only, no markdown (no ## or **). Write in first person singular only: "I", "my", "me". Never use "we" or "our". Keep tone professional but friendly. Keep description between 150 and 400 words.`;

    const sectorPart = sectorLabel ? `Sector: ${sectorLabel}. ` : '';
    const userPrompt = sectorLabel
      ? `${sectorPart}Key points or keywords from the client: ${points}. Generate a job title (at least 45 characters long) and a full, structured job description. Use newlines in the description between sections and for bullet points so it displays with clear line breaks and structure. Return valid JSON with "title" and "description".`
      : `Key points or keywords from the client: ${points}. Generate a job title (at least 45 characters long) and a full, structured job description for a trades and services job. Use newlines in the description between sections and for bullet points so it displays with clear line breaks and structure. Return valid JSON with "title" and "description".`;

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

    const TITLE_MIN_LENGTH = 45;
    let title = (parsed.title || parsed.jobTitle || parsed.headline || '').trim();
    const description = (parsed.description || parsed.jobDescription || parsed.body || '').trim();
    if (!title || !description) {
      return res.status(502).json({ error: 'AI did not return title and description' });
    }
    // Ensure title is at least 45 characters (append from description or key points if AI returned shorter)
    if (title.length < TITLE_MIN_LENGTH) {
      const extra = (description.trim().slice(0, 60) || points.trim().slice(0, 60)).replace(/\s+/g, ' ');
      title = (title + (extra ? ' – ' + extra : ' – professional service required')).trim().slice(0, 200);
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

// --- Job draft (save/restore post-job form state; client only, auth required) ---
// GET /api/jobs/draft – get current user's draft
router.get('/draft', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const draft = await JobDraft.findOne({ userId }).lean();
    if (!draft) return res.status(404).json({ error: 'No draft found' });
    return res.json({ draft: draft.payload || {} });
  } catch (err) {
    console.error('[Jobs] GET draft:', err);
    return res.status(500).json({ error: err.message || 'Failed to load draft' });
  }
});

// PUT /api/jobs/draft – upsert current user's draft
router.put('/draft', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    const payload = req.body && typeof req.body === 'object' ? req.body : {};
    await JobDraft.findOneAndUpdate(
      { userId },
      { $set: { payload, updatedAt: new Date() } },
      { upsert: true, new: true }
    );
    return res.json({ ok: true });
  } catch (err) {
    console.error('[Jobs] PUT draft:', err);
    return res.status(500).json({ error: err.message || 'Failed to save draft' });
  }
});

// DELETE /api/jobs/draft – clear draft after successful post
router.delete('/draft', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const userId = req.user?.id;
    if (!userId) return res.status(401).json({ error: 'Unauthorized' });
    await JobDraft.deleteOne({ userId });
    return res.json({ ok: true });
  } catch (err) {
    console.error('[Jobs] DELETE draft:', err);
    return res.status(500).json({ error: err.message || 'Failed to delete draft' });
  }
});

// Infer best-matching sector from a free-text description (client only; used by Post Job stepper)
// No auth required: used when posting a job without login (skills step)
router.post('/infer-sector', async (req, res) => {
  try {
    const { description } = req.body;
    const text = typeof description === 'string' ? description.trim() : '';
    if (!text) {
      return res.status(400).json({ error: 'Description is required to infer sector' });
    }

    const sectors = await Sector.find({ isActive: true }).select('_id name slug').lean();
    if (!sectors.length) {
      return res.status(500).json({ error: 'No sectors configured' });
    }

    const apiKey = process.env.OPENAI_KEY;
    if (!apiKey) {
      return res.status(503).json({ error: 'AI generation is not configured' });
    }

    const OpenAI = (await import('openai')).default;
    const openai = new OpenAI({ apiKey });

    const sectorOptions = sectors
      .map((s) => `- id: ${s._id.toString()}, slug: ${s.slug || ''}, name: ${s.name}`)
      .join('\n');

    const systemPrompt = `You are a classifier for a trades and services platform (UK).
Given a client's free-text job description, you must choose exactly ONE sector from the list below that best fits the job.
Always respond with strict JSON using these keys only: "sectorId", "sectorSlug", "sectorName".

Sectors:
${sectorOptions}

Rules:
1. sectorId must be one of the ids from the list above.
2. sectorSlug must be the slug for that sector (or empty string if not available).
3. sectorName must be exactly the name of that sector from the list.
4. Never invent new sectors or names.`;

    const userPrompt = `Client job description:\n\n${text}\n\nPick the single best matching sector from the list and respond with JSON only.`;

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
      return res.status(502).json({ error: 'Empty response from AI when inferring sector' });
    }

    let parsed;
    try {
      parsed = JSON.parse(raw);
    } catch (e) {
      console.error('[Jobs] infer-sector parse error raw=', raw);
      return res.status(502).json({ error: 'Invalid AI response format when inferring sector' });
    }

    const sectorIdStr = (parsed.sectorId || parsed.id || '').toString().trim();
    const sectorSlugStr = (parsed.sectorSlug || parsed.slug || '').toString().trim();
    const sectorNameStr = (parsed.sectorName || parsed.name || '').toString().trim();

    const normalize = (val) =>
      (val || '')
        .toString()
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '');

    const normId = normalize(sectorIdStr);
    const normSlug = normalize(sectorSlugStr);
    const normName = normalize(sectorNameStr);

    // First pass: strict id / slug / exact name match
    let chosen = sectors.find((s) => {
      if (sectorIdStr && s._id.toString() === sectorIdStr) return true;
      if (sectorSlugStr && s.slug && s.slug === sectorSlugStr) return true;
      if (sectorNameStr && s.name && s.name.toLowerCase() === sectorNameStr.toLowerCase()) return true;
      return false;
    });

    // Second pass: more tolerant matching on normalized name/slug
    if (!chosen && (normSlug || normName)) {
      chosen = sectors.find((s) => {
        const sNormSlug = normalize(s.slug);
        const sNormName = normalize(s.name);
        if (normSlug && (sNormSlug === normSlug || sNormSlug.includes(normSlug) || normSlug.includes(sNormSlug))) {
          return true;
        }
        if (normName && (sNormName === normName || sNormName.includes(normName) || normName.includes(sNormName))) {
          return true;
        }
        return false;
      });
    }

    if (!chosen) {
      // Fall back to AI-provided values so the frontend can still attempt to match
      return res.json({
        sectorId: sectorIdStr || undefined,
        sectorSlug: sectorSlugStr || undefined,
        sectorName: sectorNameStr || undefined,
      });
    }

    return res.json({
      sectorId: chosen._id.toString(),
      sectorSlug: chosen.slug,
      sectorName: chosen.name,
    });
  } catch (err) {
    console.error('[Jobs] infer-sector error:', err);
    if (err.status === 401) {
      return res.status(503).json({ error: 'AI service configuration error' });
    }
    return res.status(500).json({ error: err.message || 'Failed to infer sector' });
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

// Multer for job post attachments (post-job page)
const jobAttachmentsDir = path.join(__dirname, '..', 'uploads', 'job-attachments');
const jobAttachmentStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      fs.mkdirSync(jobAttachmentsDir, { recursive: true });
    } catch (e) {}
    cb(null, jobAttachmentsDir);
  },
  filename: (req, file, cb) => {
    const safe = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});
const jobAttachmentUpload = multer({
  storage: jobAttachmentStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

// POST /api/jobs/upload-attachment – upload one file for job post (client only); returns { url, name, mimeType, size }
router.post('/upload-attachment', authenticateToken, requireRole(['client']), jobAttachmentUpload.single('file'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/job-attachments/${req.file.filename}`;
    return res.status(201).json({
      url,
      name: req.file.originalname || req.file.filename,
      mimeType: req.file.mimetype || '',
      size: req.file.size || 0,
    });
  } catch (err) {
    console.error('[Jobs] upload-attachment:', err);
    return res.status(500).json({ error: err.message || 'Upload failed' });
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
      attachments,
      postcode,
      address,
      city,
      state,
      townCity,
      county,
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
    const postcodeTrim = postcode != null ? String(postcode).trim() : '';
    const addressTrim = address != null ? String(address).trim() : '';
    const cityTrim = (city != null ? String(city).trim() : '') || (townCity != null ? String(townCity).trim() : '');
    const stateTrim = (state != null ? String(state).trim() : '') || (county != null ? String(county).trim() : '');
    const locationTrim = location != null ? String(location).trim() : '';

    // In-person: need postcode; location can be built from address/city/state
    if (!postcodeTrim) {
      return res.status(400).json({ error: 'Postcode is required' });
    }
    if (postcodeTrim.toLowerCase() !== 'online' && !locationTrim && !addressTrim && !cityTrim) {
      return res.status(400).json({ error: 'Address or city/town is required with postcode' });
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

    // Build legacy location string for backward compatibility (list/search still use it)
    let resolvedLocation = locationTrim;
    if (!resolvedLocation && postcodeTrim.toLowerCase() !== 'online') {
      resolvedLocation = [addressTrim, cityTrim, stateTrim, postcodeTrim].filter(Boolean).join(', ');
    }
    if (!resolvedLocation) {
      resolvedLocation = postcodeTrim;
    }

    const attachmentsList = Array.isArray(attachments)
      ? attachments.filter((a) => a && (a.url || a.name)).map((a) => ({
          name: String(a.name || a.url || 'file').trim(),
          url: String(a.url || '').trim(),
          mimeType: a.mimeType ? String(a.mimeType).trim() : '',
          size: typeof a.size === 'number' ? a.size : 0,
        }))
      : [];

    const jobPayload = {
      title: title.trim(),
      description: description.trim(),
      sector: sectorDoc._id,
      sectorSlug: sectorDoc.slug,
      sectorName: sectorDoc.name,
      categorySlugs: Array.isArray(categorySlugs) ? categorySlugs : [],
      categoryLabels: Array.isArray(categoryLabels) ? categoryLabels : [],
      attachments: attachmentsList,
      postcode: postcodeTrim,
      address: addressTrim,
      city: cityTrim,
      state: stateTrim,
      location: resolvedLocation,
      timing: ['urgent', 'flexible', 'specific', 'soon'].includes(timing) ? timing : 'flexible',
      specificDate: parseJobSpecificDate(specificDate),
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
    try {
      await ensureJobSlug(job);
      const client = await User.findById(req.user.id).select('email firstName').lean();
      if (client?.email) {
        sendTemplatedEmail(
          client.email,
          'job-posted',
          {
            firstName: client.firstName || 'There',
            jobTitle: job.title || 'Your job',
            jobLink: jobLink(job),
            logoUrl: logoUrl(),
          },
          'job'
        ).catch((e) => console.error('[Jobs] job-posted email error:', e));
      }
    } catch (e) {
      console.error('[Jobs] job-posted email error:', e);
    }
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

      // Enrich with client profile + review stats (same client for all jobs)
      const responses = jobs.map((j) => toJobResponse(j));
      const clientUser = await User.findById(req.user.id).select('firstName lastName tradingName avatar createdAt country townCity').lean();
      let clientReviewCount = 0;
      let clientRatingAverage = 0;
      if (clientUser) {
        const clientReviews = await Review.find({ reviewer: req.user.id }).select('rating').lean();
        const n = (clientReviews || []).length;
        clientReviewCount = n;
        clientRatingAverage = n === 0 ? 0 : clientReviews.reduce((s, r) => s + (r.rating || 0), 0) / n;
      }
      const clientName =
        clientUser?.tradingName ||
        [clientUser?.firstName, clientUser?.lastName].filter(Boolean).join(' ') ||
        'Client';
      const clientAvatar = clientUser?.avatar;
      const clientMemberSince = clientUser?.createdAt ? new Date(clientUser.createdAt).toISOString() : undefined;
      const clientCountry = clientUser?.country || undefined;
      const clientCity = clientUser?.townCity || undefined;

      return res.json(
        responses.map((response) => ({
          ...response,
          clientName,
          clientAvatar,
          clientMemberSince,
          clientCountry,
          clientCity,
          clientReviewCount,
          clientRatingAverage,
        }))
      );
    }

    if (role === 'professional') {
      const user = await User.findById(req.user.id).select('sectors sector').lean();
      const rawSectorValues =
        user?.sectors?.length ? user.sectors : user?.sector ? [user.sector] : [];

      const sectorObjectIds = rawSectorValues
        .filter((val) => mongoose.Types.ObjectId.isValid(val))
        .map((val) => new mongoose.Types.ObjectId(val));

      const orClauses = [
        {
          status: { $in: ['awaiting-accept', 'in-progress', 'delivered', 'completed'] },
          awardedProfessionalId: new mongoose.Types.ObjectId(req.user.id),
        },
      ];
      // If pro has sectors configured, also include open jobs in matching sectors
      if (sectorObjectIds.length > 0) {
        orClauses.unshift({ status: 'open', sector: { $in: sectorObjectIds } });
      }
      const query = { $or: orClauses };
      const jobs = await Job.find(query).sort({ postedAt: -1 }).lean();
      for (const job of jobs) {
        await ensureJobSlug(job);
      }

      // Enrich each job with client profile + review stats
      const responses = [];
      for (const job of jobs) {
        const response = toJobResponse(job);
        const clientId = job.clientId?._id || job.clientId;
        if (clientId) {
          const clientUser = await User.findById(clientId).select('firstName lastName tradingName avatar createdAt country townCity').lean();
          if (clientUser) {
            response.clientName =
              clientUser.tradingName ||
              [clientUser.firstName, clientUser.lastName].filter(Boolean).join(' ') ||
              'Client';
            response.clientAvatar = clientUser.avatar;
            response.clientMemberSince = clientUser.createdAt ? new Date(clientUser.createdAt).toISOString() : undefined;
            response.clientCountry = clientUser.country || undefined;
            response.clientCity = clientUser.townCity || undefined;
          }

          const clientReviews = await Review.find({ reviewer: clientId }).select('rating').lean();
          const n = (clientReviews || []).length;
          response.clientReviewCount = n;
          response.clientRatingAverage =
            n === 0 ? 0 : clientReviews.reduce((s, r) => s + (r.rating || 0), 0) / n;
        }
        responses.push(response);
      }

      return res.json(responses);
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

/** Job Mongoose document by 24-char hex id or slug (avoids CastError when :id is a slug string). */
async function loadJobDocByIdOrSlug(idOrSlug) {
  if (idOrSlug == null || idOrSlug === '') return null;
  const s = String(idOrSlug).trim();
  if (!s) return null;
  let job = null;
  if (isMongoId(s)) {
    job = await Job.findById(s);
  }
  if (!job) {
    job = await Job.findOne({ slug: s });
  }
  return job;
}

const REVIEW_CUTOFF_DAYS = 90;
function isJobCompletedOver90DaysAgo(job) {
  if (!job || !job.completedAt) return false;
  const completedAt = new Date(job.completedAt).getTime();
  if (Number.isNaN(completedAt)) return false;
  const days = (Date.now() - completedAt) / (24 * 60 * 60 * 1000);
  return days >= REVIEW_CUTOFF_DAYS;
}

/** Backfill Review row from legacy Job-only client review fields */
async function ensureJobReviewDocument(job) {
  if (!job || !job._id) return null;
  let doc = await Review.findOne({ job: job._id });
  if (doc) return doc;
  if (!job.clientReviewAt || job.clientReviewRating == null || !job.awardedProfessionalId) return null;
  const client = await User.findById(job.clientId).select('firstName lastName tradingName').lean();
  if (!client) return null;
  doc = new Review({
    professional: job.awardedProfessionalId,
    job: job._id,
    order: null,
    service: null,
    reviewer: job.clientId,
    reviewerName: `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.tradingName || 'Anonymous',
    rating: Number(job.clientReviewRating),
    comment: (job.clientReviewComment && String(job.clientReviewComment).trim()) || '',
  });
  await doc.save();
  return doc;
}

// Shared files (client + awarded pro only) – multer for job-files
const jobFilesDir = path.join(__dirname, '..', 'uploads', 'job-files');
const jobFilesStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    try {
      fs.mkdirSync(jobFilesDir, { recursive: true });
    } catch (e) {}
    cb(null, jobFilesDir);
  },
  filename: (req, file, cb) => {
    const safe = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_');
    cb(null, `${Date.now()}-${safe}`);
  },
});
const jobFilesUpload = multer({
  storage: jobFilesStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
});

// Job milestone delivery uploads (pro delivers work per milestone)
const jobDeliveriesDir = path.join(__dirname, '..', 'uploads', 'job-deliveries');
fs.mkdirSync(jobDeliveriesDir, { recursive: true });
const jobDeliveriesStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, jobDeliveriesDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const base = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});
const jobDeliveriesUpload = multer({
  storage: jobDeliveriesStorage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'application/pdf'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('File type not allowed'));
  },
});

// Client revision request attachments (request-revision with files)
const jobRevisionsDir = path.join(__dirname, '..', 'uploads', 'job-revisions');
fs.mkdirSync(jobRevisionsDir, { recursive: true });
const jobRevisionsStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, jobRevisionsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '';
    const base = (file.originalname || 'file').replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 80);
    cb(null, `${Date.now()}-${base}${ext}`);
  },
});
const jobRevisionsUpload = multer({
  storage: jobRevisionsStorage,
  limits: { fileSize: 50 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'video/mp4', 'video/mpeg', 'video/quicktime', 'video/x-msvideo', 'video/webm', 'application/pdf'];
    if (allowed.includes(file.mimetype)) return cb(null, true);
    cb(new Error('File type not allowed'));
  },
});

function canAccessJobFiles(job, userId, userRole) {
  if (!job || !userId) return false;
  const clientId = job.clientId?.toString?.();
  const awardedId = job.awardedProfessionalId?.toString?.();
  const statusOk =
    job.status === 'awaiting-accept' ||
    job.status === 'in-progress' ||
    job.status === 'delivered' ||
    job.status === 'completed';
  if (userRole === 'client' && clientId === userId && statusOk) return true;
  if (userRole === 'professional' && awardedId === userId && statusOk) return true;
  return false;
}

// GET /api/jobs/:id/files – list shared files (client or awarded pro)
router.get('/:id/files', authenticateToken, async (req, res) => {
  try {
    const job = await findJobByIdOrSlug(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (!canAccessJobFiles(job, req.user.id, req.user.role)) {
      return res.status(403).json({ error: 'Not allowed to access job files' });
    }
    const jobId = job._id;
    const files = await JobFile.find({ jobId }).sort({ createdAt: -1 }).lean();
    return res.json({
      files: files.map((f) => ({
        id: f._id.toString(),
        name: f.name,
        url: f.url,
        mimeType: f.mimeType || '',
        size: f.size || 0,
        uploadedBy: f.uploadedBy?.toString?.() || f.uploadedBy,
        createdAt: f.createdAt ? new Date(f.createdAt).toISOString() : undefined,
      })),
    });
  } catch (err) {
    console.error('[Jobs] GET files:', err);
    return res.status(500).json({ error: err.message || 'Failed to list files' });
  }
});

// POST /api/jobs/:id/files – upload shared file (client or awarded pro)
router.post('/:id/files', authenticateToken, jobFilesUpload.single('file'), async (req, res) => {
  try {
    const job = await findJobByIdOrSlug(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (!canAccessJobFiles(job, req.user.id, req.user.role)) {
      return res.status(403).json({ error: 'Not allowed to upload to this job' });
    }
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const url = `/uploads/job-files/${req.file.filename}`;
    const doc = await JobFile.create({
      jobId: job._id,
      uploadedBy: req.user.id,
      name: req.file.originalname || req.file.filename,
      url,
      mimeType: req.file.mimetype || '',
      size: req.file.size || 0,
    });
    return res.status(201).json({
      id: doc._id.toString(),
      name: doc.name,
      url: doc.url,
      mimeType: doc.mimeType || '',
      size: doc.size || 0,
      uploadedBy: doc.uploadedBy.toString(),
      createdAt: doc.createdAt ? new Date(doc.createdAt).toISOString() : undefined,
    });
  } catch (err) {
    console.error('[Jobs] POST file:', err);
    return res.status(500).json({ error: err.message || 'Failed to upload file' });
  }
});

// Get job review bundle (client review + professional client review)
router.get('/:id/review', authenticateToken, async (req, res) => {
  try {
    const idOrSlug = req.params.id;
    const job = await loadJobDocByIdOrSlug(idOrSlug);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const uid = req.user.id.toString();
    const isClient = job.clientId?.toString() === uid;
    const isPro = job.awardedProfessionalId?.toString() === uid;
    if (!isClient && !isPro) {
      return res.status(403).json({ error: 'Not allowed to view reviews for this job' });
    }

    let review = await Review.findOne({ job: job._id })
      .populate('reviewer', 'firstName lastName tradingName avatar')
      .populate('responseBy', 'firstName lastName tradingName avatar');
    if (!review) {
      const backfill = await ensureJobReviewDocument(job);
      if (backfill) {
        review = await Review.findById(backfill._id)
          .populate('reviewer', 'firstName lastName tradingName avatar')
          .populate('responseBy', 'firstName lastName tradingName avatar');
      }
    }

    const buyerReview =
      job.buyerReview && job.buyerReview.reviewedAt
        ? {
            rating: job.buyerReview.rating,
            comment: job.buyerReview.comment || '',
            reviewedBy: job.buyerReview.reviewedBy?.toString?.() || job.buyerReview.reviewedBy,
            reviewerName: job.buyerReview.reviewerName || '',
            reviewedAt: job.buyerReview.reviewedAt
              ? new Date(job.buyerReview.reviewedAt).toISOString()
              : undefined,
          }
        : null;

    if (!review) {
      return res.json({ review: null, buyerReview });
    }

    return res.json({
      review: {
        id: review._id.toString(),
        professional: review.professional.toString(),
        job: review.job ? review.job.toString() : job._id.toString(),
        reviewer: review.reviewer
          ? {
              id: review.reviewer._id.toString(),
              name: review.reviewerName,
              avatar: review.reviewer.avatar,
            }
          : {
              name: review.reviewerName,
            },
        rating: review.rating,
        comment: review.comment,
        response: review.response,
        responseBy: review.responseBy
          ? {
              id: review.responseBy._id.toString(),
              name:
                `${review.responseBy.firstName || ''} ${review.responseBy.lastName || ''}`.trim() ||
                review.responseBy.tradingName,
              avatar: review.responseBy.avatar,
            }
          : null,
        responseAt: review.responseAt ? new Date(review.responseAt).toISOString() : undefined,
        hasResponded: review.hasResponded || false,
        createdAt: new Date(review.createdAt).toISOString(),
      },
      buyerReview,
    });
  } catch (err) {
    console.error('[Jobs] GET review error:', err);
    return res.status(500).json({ error: err.message || 'Failed to fetch review' });
  }
});

// Client: submit or update review after the job is completed
router.post('/:id/client-review', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const idOrSlug = req.params.id;
    const job = await loadJobDocByIdOrSlug(idOrSlug);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.clientId?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed to review this job' });
    }
    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed jobs' });
    }
    if (isJobCompletedOver90DaysAgo(job)) {
      return res.status(400).json({ error: 'Reviews can only be submitted within 90 days of job completion.' });
    }
    if (!job.awardedProfessionalId) {
      return res.status(400).json({ error: 'No professional to review' });
    }

    const rating = Number(req.body.rating);
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid rating (1-5) is required' });
    }
    const comment = String(req.body.comment || '').trim();

    const client = await User.findById(req.user.id);
    if (!client) {
      return res.status(404).json({ error: 'Client not found' });
    }

    const reviewerName =
      `${client.firstName || ''} ${client.lastName || ''}`.trim() || client.tradingName || 'Anonymous';

    let reviewDoc = await Review.findOne({ job: job._id });
    if (reviewDoc) {
      reviewDoc.rating = rating;
      reviewDoc.comment = comment;
      reviewDoc.reviewer = client._id;
      reviewDoc.reviewerName = reviewerName;
    } else {
      reviewDoc = new Review({
        professional: job.awardedProfessionalId,
        job: job._id,
        order: null,
        service: null,
        reviewer: client._id,
        reviewerName,
        rating,
        comment,
      });
    }
    await reviewDoc.save();

    job.clientReviewRating = rating;
    job.clientReviewComment = comment;
    if (!job.clientReviewAt) job.clientReviewAt = new Date();
    await job.save();
    emitJobUpdated(job);
    return res.json({
      message: 'Review submitted successfully',
      job: toJobResponse(job),
      review: {
        id: reviewDoc._id,
        rating: reviewDoc.rating,
        comment: reviewDoc.comment,
        reviewerName: reviewDoc.reviewerName,
        createdAt: reviewDoc.createdAt,
      },
    });
  } catch (err) {
    console.error('[Jobs] client-review error:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit review' });
  }
});

// Professional: submit review for client
router.post('/:id/buyer-review', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const idOrSlug = req.params.id;
    const job = await loadJobDocByIdOrSlug(idOrSlug);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.awardedProfessionalId?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed to review this job' });
    }
    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Can only review completed jobs' });
    }
    if (isJobCompletedOver90DaysAgo(job)) {
      return res.status(400).json({ error: 'Reviews can only be submitted within 90 days of job completion.' });
    }

    const rating = Number(req.body.rating);
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ error: 'Valid rating (1-5) is required' });
    }

    const professional = await User.findById(req.user.id);
    if (!professional) {
      return res.status(404).json({ error: 'Professional not found' });
    }

    const comment = String(req.body.comment || '').trim();
    job.buyerReview = {
      rating,
      comment,
      reviewedBy: req.user.id,
      reviewerName: professional.tradingName || 'Professional',
      reviewedAt: new Date(),
    };
    job.markModified('buyerReview');
    await job.save();
    emitJobUpdated(job);

    return res.json({
      message: 'Client review submitted successfully',
      buyerReview: {
        rating: job.buyerReview.rating,
        comment: job.buyerReview.comment,
        reviewedBy: job.buyerReview.reviewedBy?.toString?.(),
        reviewerName: job.buyerReview.reviewerName,
        reviewedAt: job.buyerReview.reviewedAt ? new Date(job.buyerReview.reviewedAt).toISOString() : undefined,
      },
      job: toJobResponse(job),
    });
  } catch (err) {
    console.error('[Jobs] buyer-review error:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit client review' });
  }
});

// Professional: respond to client review (one-time)
router.post('/:id/respond-to-review', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const idOrSlug = req.params.id;
    const job = await loadJobDocByIdOrSlug(idOrSlug);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.awardedProfessionalId?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed to respond for this job' });
    }

    const { response } = req.body;
    if (!response || !String(response).trim()) {
      return res.status(400).json({ error: 'Response is required' });
    }

    if (job.status !== 'completed') {
      return res.status(400).json({ error: 'Can only respond to reviews for completed jobs' });
    }
    if (isJobCompletedOver90DaysAgo(job)) {
      return res.status(400).json({ error: 'Review responses can only be submitted within 90 days of job completion.' });
    }

    let reviewDoc = await Review.findOne({ job: job._id });
    if (!reviewDoc) {
      reviewDoc = await ensureJobReviewDocument(job);
    }
    if (!reviewDoc) {
      return res.status(400).json({ error: 'No client review found for this job' });
    }
    if (reviewDoc.hasResponded) {
      return res.status(400).json({ error: 'You have already responded to this review' });
    }

    reviewDoc.response = String(response).trim();
    reviewDoc.responseBy = req.user.id;
    reviewDoc.responseAt = new Date();
    reviewDoc.hasResponded = true;
    await reviewDoc.save();

    job.professionalReviewResponse = reviewDoc.response;
    job.professionalReviewResponseAt = reviewDoc.responseAt;
    await job.save();
    emitJobUpdated(job);

    return res.json({
      message: 'Response submitted successfully',
      professionalResponse: reviewDoc.response,
      professionalResponseDate: reviewDoc.responseAt,
      job: toJobResponse(job),
    });
  } catch (err) {
    console.error('[Jobs] respond-to-review error:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit response' });
  }
});

// Professional: deliver work for a milestone (files + message)
router.post('/:id/deliver-milestone', authenticateToken, requireRole(['professional']), jobDeliveriesUpload.array('files', 10), async (req, res) => {
  const { unlinkSync } = await import('fs');
  try {
    const idOrSlug = req.params.id;
    const job = await loadJobDocByIdOrSlug(idOrSlug);
    if (!job) {
      if (req.files?.length) req.files.forEach((f) => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.awardedProfessionalId?.toString() !== req.user.id) {
      if (req.files?.length) req.files.forEach((f) => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(403).json({ error: 'Not allowed to deliver work for this job' });
    }
    if (job.status !== 'in-progress' && job.status !== 'delivered') {
      if (req.files?.length) req.files.forEach((f) => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(400).json({ error: 'Job must be in progress to deliver a milestone' });
    }
    const milestones = job.milestones || [];
    const rawIdx = req.body.milestoneIndex;
    const milestoneIndex = rawIdx !== undefined && rawIdx !== null ? parseInt(String(rawIdx), 10) : -1;
    if (isNaN(milestoneIndex) || milestoneIndex < 0 || milestoneIndex >= milestones.length) {
      if (req.files?.length) req.files.forEach((f) => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(400).json({ error: 'Invalid milestone index' });
    }
    const milestone = milestones[milestoneIndex];
    if (milestone.status !== 'in-progress') {
      if (req.files?.length) req.files.forEach((f) => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(400).json({ error: 'Only in-progress milestones can be delivered' });
    }
    const deliveryMessage = (req.body.deliveryMessage && String(req.body.deliveryMessage).trim()) || '';
    const milestoneDeliveries = job.milestoneDeliveries || [];
    const existing = milestoneDeliveries.find((d) => d.milestoneIndex === milestoneIndex);
    const isRevision = existing && existing.revisionRequestedAt;
    const fileUrls = [];
    if (req.files && req.files.length > 0) {
      for (const f of req.files) {
        fileUrls.push({ url: `/uploads/job-deliveries/${f.filename}`, name: f.originalname || f.filename });
      }
    }
    if (!job.milestoneDeliveries) job.milestoneDeliveries = [];
    if (isRevision && existing) {
      existing.deliveredAt = new Date();
      existing.deliveryMessage = deliveryMessage;
      existing.fileUrls = fileUrls.length ? fileUrls : existing.fileUrls || [];
      existing.revisionRequestedAt = null;
      existing.revisionMessage = '';
      existing.revisionRequestedBy = null;
      // Mark milestone as delivered again after revision re-delivery
      milestones[milestoneIndex].status = 'delivered';
    } else if (!existing) {
      job.milestoneDeliveries.push({
        milestoneIndex,
        deliveryMessage,
        fileUrls,
        deliveredAt: new Date(),
        deliveredBy: req.user.id,
        approvedAt: null,
        approvedBy: null,
        revisionRequestedAt: null,
        revisionMessage: '',
        revisionRequestedBy: null,
      });
      milestones[milestoneIndex].status = 'delivered';
    } else {
      if (req.files?.length) req.files.forEach((f) => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(400).json({ error: 'This milestone has already been delivered' });
    }
    // If all (non-cancelled) milestones are delivered (or already released), mark job as delivered
    const relevantMilestones = (job.milestones || []).filter((m) => m && m.status !== 'cancelled');
    const allDelivered = relevantMilestones.length > 0 && relevantMilestones.every((m) => m.status === 'delivered' || m.status === 'released');
    job.status = allDelivered ? 'delivered' : 'in-progress';
    job.markModified('milestones');
    job.markModified('milestoneDeliveries');
    await job.save();
    emitJobUpdated(job);
    const jobSlug = job.slug || job._id.toString();
    const jobTitle = job.title || 'Job';
    const clientId = job.clientId?.toString?.();
    const milestoneName = (milestones[milestoneIndex] && (milestones[milestoneIndex].name || milestones[milestoneIndex].description)) || 'Milestone';
    if (clientId) {
      await Notification.createNotification({
        userId: clientId,
        type: 'job_milestone_delivered',
        title: 'Work delivered',
        message: `Professional delivered work for "${milestoneName}" on "${jobTitle}".`,
        relatedId: job._id,
        relatedModel: 'Job',
        link: `/job/${jobSlug}?tab=payment`,
        metadata: { jobId: job._id.toString(), jobSlug, jobTitle, milestoneIndex },
      });
    }
    const response = toJobResponse(job);
    return res.json({ message: 'Milestone delivered successfully.', job: response });
  } catch (err) {
    if (req.files?.length) {
      const { unlinkSync: unlink } = await import('fs');
      req.files.forEach((f) => { try { if (f.path) unlink(f.path); } catch (_) {} });
    }
    console.error('[Jobs] deliver-milestone error:', err);
    return res.status(500).json({ error: err.message || 'Failed to deliver milestone' });
  }
});

// Client: approve a milestone delivery (View Work delivered → Approve)
router.patch('/:id/milestones/:milestoneId/delivery/approve', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    let job = await Job.findById(req.params.id);
    if (!job) job = await Job.findOne({ slug: req.params.id });
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.clientId?.toString() !== req.user.id) return res.status(403).json({ error: 'Not allowed to approve delivery for this job' });
    const milestones = job.milestones || [];
    const milestoneId = req.params.milestoneId;
    const milestoneIndex = milestones.findIndex((m) => m._id.toString() === milestoneId);
    if (milestoneIndex === -1) return res.status(404).json({ error: 'Milestone not found' });
    const milestone = milestones[milestoneIndex];
    if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
    const deliveries = job.milestoneDeliveries || [];
    const delivery = deliveries.find((d) => d.milestoneIndex === milestoneIndex);
    if (!delivery) return res.status(400).json({ error: 'No delivery found for this milestone' });
    if (delivery.approvedAt) return res.status(400).json({ error: 'Delivery already approved' });
    delivery.approvedAt = new Date();
    delivery.approvedBy = req.user.id;

    // Approving delivery should immediately release funds to the professional
    if (milestone.status !== 'delivered') {
      return res.status(400).json({ error: 'Only delivered milestones can be approved' });
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
            via: 'delivery_approve',
          },
        });
      }
    }
    milestone.status = 'released';
    milestone.releasedAt = new Date();
    // If all milestones are released, mark job as completed
    const totalMilestones = (job.milestones || []).reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
    const totalReleased = (job.milestones || []).filter((m) => m.status === 'released').reduce((sum, m) => sum + (Number(m.amount) || 0), 0);
    if (totalMilestones > 0 && totalReleased >= totalMilestones) {
      job.status = 'completed';
      if (!job.completedAt) job.completedAt = new Date();
    }
    job.markModified('milestones');
    job.markModified('milestoneDeliveries');
    await job.save();
    emitJobUpdated(job);
    const jobSlug = job.slug || job._id.toString();
    const jobTitle = job.title || 'Job';
    const proId = job.awardedProfessionalId?.toString?.();
    const milestoneName = (milestones[milestoneIndex] && (milestones[milestoneIndex].name || milestones[milestoneIndex].description)) || 'Milestone';
    if (proId) {
      await Notification.createNotification({
        userId: proId,
        type: 'job_delivery_approved',
        title: 'Delivery approved',
        message: `Client approved your delivery for "${milestoneName}" on "${jobTitle}".`,
        relatedId: job._id,
        relatedModel: 'Job',
        link: `/job/${jobSlug}?tab=payment`,
        metadata: { jobId: job._id.toString(), jobSlug, jobTitle, milestoneIndex },
      });
    }
    return res.json({ job: toJobResponse(job), message: 'Delivery approved and payment released.' });
  } catch (err) {
    console.error('[Jobs] delivery/approve error:', err);
    return res.status(500).json({ error: err.message || 'Failed to approve delivery' });
  }
});

// Client: request revision for a milestone delivery (View Work delivered → Request Revision); supports optional files
router.post('/:id/milestones/:milestoneId/delivery/request-revision', authenticateToken, requireRole(['client']), jobRevisionsUpload.array('files', 10), async (req, res) => {
  const { unlinkSync } = await import('fs');
  try {
    let job = await Job.findById(req.params.id);
    if (!job) job = await Job.findOne({ slug: req.params.id });
    if (!job) {
      if (req.files?.length) req.files.forEach((f) => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(404).json({ error: 'Job not found' });
    }
    if (job.clientId?.toString() !== req.user.id) {
      if (req.files?.length) req.files.forEach((f) => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(403).json({ error: 'Not allowed to request revision for this job' });
    }
    const milestones = job.milestones || [];
    const milestoneId = req.params.milestoneId;
    const milestoneIndex = milestones.findIndex((m) => m._id.toString() === milestoneId);
    if (milestoneIndex === -1) {
      if (req.files?.length) req.files.forEach((f) => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(404).json({ error: 'Milestone not found' });
    }
    const deliveries = job.milestoneDeliveries || [];
    const delivery = deliveries.find((d) => d.milestoneIndex === milestoneIndex);
    if (!delivery) {
      if (req.files?.length) req.files.forEach((f) => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(400).json({ error: 'No delivery found for this milestone' });
    }
    if (delivery.approvedAt) {
      if (req.files?.length) req.files.forEach((f) => { try { if (f.path) unlinkSync(f.path); } catch (_) {} });
      return res.status(400).json({ error: 'Cannot request revision after approval' });
    }
    const revisionMessage = (req.body.revisionMessage && String(req.body.revisionMessage).trim()) || '';
    const revisionFileUrls = [];
    if (req.files && req.files.length > 0) {
      for (const f of req.files) {
        revisionFileUrls.push({ url: `/uploads/job-revisions/${f.filename}`, name: f.originalname || f.filename });
      }
    }
    delivery.revisionRequestedAt = new Date();
    delivery.revisionMessage = revisionMessage;
    delivery.revisionRequestedBy = req.user.id;
    delivery.revisionFileUrls = revisionFileUrls.length ? revisionFileUrls : [];
    // Put milestone back in-progress so pro can re-deliver; also move job back to in-progress if it was delivered
    if (milestones[milestoneIndex]) {
      milestones[milestoneIndex].status = 'in-progress';
      job.markModified('milestones');
    }
    if (job.status === 'delivered') {
      job.status = 'in-progress';
    }
    job.markModified('milestoneDeliveries');
    await job.save();
    emitJobUpdated(job);
    const jobSlug = job.slug || job._id.toString();
    const jobTitle = job.title || 'Job';
    const proId = job.awardedProfessionalId?.toString?.();
    if (proId) {
      await Notification.createNotification({
        userId: proId,
        type: 'job_revision_requested',
        title: 'Revision requested',
        message: `Client requested revision for milestone delivery on "${jobTitle}".`,
        relatedId: job._id,
        relatedModel: 'Job',
        link: `/job/${jobSlug}?tab=payment`,
        metadata: { jobId: job._id.toString(), jobSlug, jobTitle, milestoneIndex },
      });
    }
    return res.json({ job: toJobResponse(job), message: 'Revision requested.' });
  } catch (err) {
    if (req.files?.length) {
      const { unlinkSync: unlink } = await import('fs');
      req.files.forEach((f) => { try { if (f.path) unlink(f.path); } catch (_) {} });
    }
    console.error('[Jobs] delivery/request-revision error:', err);
    return res.status(500).json({ error: err.message || 'Failed to request revision' });
  }
});

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
    const isAwardedPro = isPro && job.awardedProfessionalId && job.awardedProfessionalId.toString() === req.user.id;
    const sectorMatch = !!jobSectorId && proSectorIdStrings.includes(jobSectorId);
    const canView = isClient || (isPro && (sectorMatch || hasQuoted || isAwardedPro));
    if (!canView) {
      return res.status(403).json({ error: 'Not allowed to view this job' });
    }
    const response = toJobResponse(job);
    if (job.status === 'open') {
      try {
        const settings = await PaymentSettings.getSettings();
        const closedJobDays = settings.closedJobDays ?? 30;
        const postedAt = job.postedAt ? new Date(job.postedAt) : new Date();
        response.closesAt = new Date(postedAt.getTime() + closedJobDays * 24 * 60 * 60 * 1000).toISOString();
      } catch (_) {
        response.closesAt = undefined;
      }
    }
    if (job.status === 'awaiting-accept' && job.awardPendingAt) {
      try {
        const settings = await PaymentSettings.getSettings();
        const awardHours = settings.waitingTimeToAcceptJobAwardHours ?? 0;
        if (awardHours > 0) {
          const start = new Date(job.awardPendingAt);
          response.awardAcceptDeadlineAt = new Date(start.getTime() + awardHours * 60 * 60 * 1000).toISOString();
        }
      } catch (_) {
        response.awardAcceptDeadlineAt = undefined;
      }
    }
    const clientUser = await User.findById(job.clientId).select('firstName lastName tradingName avatar createdAt country townCity').lean();
    if (clientUser) {
      response.clientName = clientUser.tradingName || [clientUser.firstName, clientUser.lastName].filter(Boolean).join(' ') || 'Client';
      response.clientAvatar = clientUser.avatar;
      response.clientMemberSince = clientUser.createdAt ? new Date(clientUser.createdAt).toISOString() : undefined;
      response.clientCountry = clientUser.country || undefined;
      response.clientCity = clientUser.townCity || undefined;
    }
    if (clientUser && job.clientId) {
      const clientReviews = await Review.find({ reviewer: job.clientId }).select('rating').lean();
      const n = (clientReviews || []).length;
      response.clientReviewCount = n;
      response.clientRatingAverage = n === 0 ? undefined : (clientReviews.reduce((s, r) => s + (r.rating || 0), 0) / n);
    }
    // Ensure each quote has the professional's current avatar + verification status + profile title + town/city (from User)
    const quoteProIds = [...new Set((response.quotes || []).map((q) => q.professionalId).filter(Boolean))];
    if (quoteProIds.length > 0) {
      const pros = await User.find({ _id: { $in: quoteProIds } }).select('avatar verification country townCity publicProfile.profileTitle').lean();
      const avatarByProId = Object.fromEntries(pros.map((u) => [u._id.toString(), u.avatar]).filter(([, v]) => v != null));
      const countryByProId = Object.fromEntries(
        pros
          .map((u) => [u._id.toString(), u.country])
          .filter(([, v]) => typeof v === 'string' && v.trim().length > 0)
      );
      const townCityByProId = Object.fromEntries(
        pros
          .map((u) => [u._id.toString(), u.townCity != null ? String(u.townCity).trim() : undefined])
      );
      const profileTitleByProId = Object.fromEntries(
        pros
          .map((u) => [u._id.toString(), u.publicProfile && typeof u.publicProfile.profileTitle === 'string' ? u.publicProfile.profileTitle.trim() : undefined])
      );
      const verifiedByProId = Object.fromEntries(
        pros.map((u) => {
          const v = u.verification || {};
          const steps = ['email', 'phone', 'address', 'idCard', 'paymentMethod', 'publicLiabilityInsurance'];
          const fullyVerified = steps.every((key) => v[key] && v[key].status === 'verified');
          return [u._id.toString(), !!fullyVerified];
        })
      );
      response.quotes = response.quotes.map((q) => ({
        ...q,
        professionalAvatar: avatarByProId[q.professionalId] ?? q.professionalAvatar,
        professionalFullyVerified: verifiedByProId[q.professionalId] ?? false,
        professionalCountry: countryByProId[q.professionalId] ?? q.professionalCountry ?? undefined,
        professionalTownCity: townCityByProId[q.professionalId] ?? q.professionalTownCity ?? undefined,
        professionalProfileTitle: profileTitleByProId[q.professionalId] ?? q.professionalProfileTitle ?? undefined,
      }));
    }
    res.json(response);
  } catch (err) {
    console.error('[Jobs] Get error:', err);
    res.status(500).json({ error: err.message || 'Failed to get job' });
  }
});

// GET /api/jobs/:id/client-profile – client public profile for preview modal (authenticated)
router.get('/:id/client-profile', authenticateToken, async (req, res) => {
  try {
    const job = await findJobByIdOrSlug(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const clientId = job.clientId?._id || job.clientId;
    if (!clientId) return res.status(404).json({ error: 'Client not found' });
    const clientUser = await User.findById(clientId)
      .select('firstName lastName tradingName avatar createdAt publicProfile country townCity')
      .lean();
    if (!clientUser) return res.status(404).json({ error: 'Client not found' });
    const reviews = await Review.find({ reviewer: clientId })
      .sort({ createdAt: -1 })
      .limit(50)
      .populate('professional', 'firstName lastName tradingName avatar')
      .lean();
    const reviewList = (reviews || []).map((r) => ({
      id: (r._id || r.id)?.toString?.(),
      rating: r.rating,
      comment: r.comment || null,
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : null,
      professionalName: r.professional?.tradingName || [r.professional?.firstName, r.professional?.lastName].filter(Boolean).join(' ') || 'Professional',
      professionalAvatar: r.professional?.avatar,
      response: r.response || null,
      responseAt: r.responseAt ? new Date(r.responseAt).toISOString() : null,
    }));
    const reviewCount = reviewList.length;
    const ratingAverage = reviewCount === 0
      ? 0
      : reviewList.reduce((s, r) => s + (r.rating || 0), 0) / reviewCount;
    const name = (clientUser.tradingName || [clientUser.firstName, clientUser.lastName].filter(Boolean).join(' ') || 'Client').trim();
    return res.json({
      name,
      avatar: clientUser.avatar,
      createdAt: clientUser.createdAt ? new Date(clientUser.createdAt).toISOString() : null,
      bio: (clientUser.publicProfile && clientUser.publicProfile.bio) ? clientUser.publicProfile.bio.trim() : '',
      country: clientUser.country || null,
      townCity: clientUser.townCity || null,
      reviews: reviewList,
      reviewCount,
      ratingAverage: Math.round(ratingAverage * 10) / 10,
    });
  } catch (err) {
    console.error('[Jobs] Client profile error:', err);
    res.status(500).json({ error: err.message || 'Failed to load client profile' });
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
      .select('_id tradingName firstName lastName avatar postcode address townCity publicProfile.bio publicProfile.profileTitle verification')
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
        const bio = (pro.publicProfile && pro.publicProfile.bio) ? String(pro.publicProfile.bio).trim() : '';
        const profileTitle = (pro.publicProfile && pro.publicProfile.profileTitle) ? String(pro.publicProfile.profileTitle).trim() : '';
        const v = pro.verification || {};
        const steps = ['email', 'phone', 'address', 'idCard', 'paymentMethod', 'publicLiabilityInsurance'];
        const fullyVerified = steps.every((key) => v[key] && v[key].status === 'verified');
        return {
          id,
          name: pro.tradingName || [pro.firstName, pro.lastName].filter(Boolean).join(' ') || 'Professional',
          title: profileTitle || pro.tradingName || 'Professional',
          profileTitle: profileTitle || undefined,
          category: sectorName,
          image: pro.avatar,
          rating: stats.rating,
          reviewCount: stats.reviewCount,
          completedJobs: 0,
          location: [pro.townCity, pro.postcode].filter(Boolean).join(', ') || pro.postcode || '',
          skills: [],
          distanceMiles,
          bio: bio || undefined,
          fullyVerified: !!fullyVerified,
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
    const { professionalId, message: clientMessage } = req.body;
    if (!professionalId) return res.status(400).json({ error: 'professionalId is required' });
    const pro = await User.findById(professionalId).select('_id role tradingName firstName lastName').lean();
    if (!pro || pro.role !== 'professional') return res.status(404).json({ error: 'Professional not found' });
    const jobSlug = job.slug || job._id.toString();
    const jobTitle = job.title || 'Job';
    const clientName = req.user.name || req.user.firstName || 'A client';
    const baseMessage = `${clientName} invited you to submit a quote for "${jobTitle}".`;
    const notificationMessage = (clientMessage && String(clientMessage).trim())
      ? `${baseMessage}\n\nMessage: ${String(clientMessage).trim()}`
      : baseMessage;
    await Notification.createNotification({
      userId: pro._id,
      type: 'job_invitation',
      title: 'Job quote invitation',
      message: notificationMessage,
      relatedId: job._id,
      relatedModel: 'Job',
      link: `/job/${jobSlug}`,
      metadata: { jobId: job._id.toString(), jobSlug, jobTitle, clientId: req.user.id },
    });
    try {
      const proUser = await User.findById(professionalId).select('email firstName').lean();
      if (proUser?.email) {
        await sendTemplatedEmail(
          proUser.email,
          'job-invite-received',
          {
            firstName: proUser.firstName || 'There',
            jobTitle: jobTitle,
            clientName: clientName,
            jobLink: jobLink(job),
            logoUrl: logoUrl(),
          },
          'job'
        );
      }
    } catch (e) {
      console.error('[Jobs] job-invite-received email error:', e);
    }
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
    const reason = typeof req.body.reason === 'string' ? req.body.reason.trim() : '';
    const message = typeof req.body.message === 'string' ? req.body.message.trim() : '';
    if (!reason) return res.status(400).json({ error: 'Reason is required' });
    const finalMessage = message || reason;
    await JobReport.create({
      jobId: job._id,
      reporterId: new mongoose.Types.ObjectId(req.user.id),
      reporterRole: req.user.role === 'client' ? 'client' : req.user.role === 'professional' ? 'professional' : undefined,
      reason,
      message: finalMessage,
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
      'city',
      'state',
      'location',
      'timing',
      'specificDate',
      'budgetType',
      'budgetAmount',
      'budgetMin',
      'budgetMax',
      'status',
      'sector',
      'sectorSlug',
      'sectorName',
      'categorySlugs',
      'categoryLabels',
      'attachments',
    ];
    for (const key of allowed) {
      if (req.body[key] !== undefined) {
        if (key === 'specificDate') {
          job[key] = parseJobSpecificDate(req.body[key]);
        }
        else if (key === 'budgetAmount') job[key] = Number(req.body[key]);
        else if (key === 'budgetMin') job.budgetMin = req.body[key] === null || req.body[key] === '' ? null : Number(req.body[key]);
        else if (key === 'budgetMax') job.budgetMax = req.body[key] === null || req.body[key] === '' ? null : Number(req.body[key]);
        else if (key === 'status' && ['open', 'cancelled'].includes(req.body[key])) job[key] = req.body[key];
        else if (key === 'sector' && mongoose.Types.ObjectId.isValid(req.body[key])) job.sector = new mongoose.Types.ObjectId(req.body[key]);
        else if (key === 'sectorSlug') job.sectorSlug = String(req.body[key]).trim().toLowerCase();
        else if (key === 'sectorName') job.sectorName = String(req.body[key]).trim();
        else if (key === 'categorySlugs') job.categorySlugs = Array.isArray(req.body[key]) ? req.body[key].map((s) => String(s).trim()) : [];
        else if (key === 'categoryLabels') job.categoryLabels = Array.isArray(req.body[key]) ? req.body[key].map((s) => String(s).trim()) : [];
        else if (key === 'attachments') {
          job.attachments = Array.isArray(req.body[key])
            ? req.body[key]
                .filter((a) => a && typeof a.name === 'string' && typeof a.url === 'string')
                .map((a) => ({ name: a.name, url: a.url, mimeType: a.mimeType || '', size: a.size || 0 }))
            : [];
        } else if (key !== 'status') job[key] = req.body[key];
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
    if (job.status === 'closed') {
      return res.status(400).json({ error: 'This job is closed. No new quotes can be sent.' });
    }
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

    const deducted = await deductBid(req.user.id);
    if (!deducted.ok) {
      return res.status(403).json({
        error: 'Insufficient credits.',
      });
    }

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
    try {
      await ensureJobSlug(job);
      await QuoteCreditUsage.create({
        userId: req.user.id,
        jobId: job._id,
        jobSlug: job.slug || '',
        jobTitle: job.title || 'Job',
        credits: 1,
        source: deducted.source,
      });
    } catch (logErr) {
      console.error('[Jobs] QuoteCreditUsage log error:', logErr);
    }
    emitJobUpdated(job);
    res.status(201).json(toJobResponse(job));
    // Send quote emails in background so response is immediate
    (async () => {
      try {
        const clientUser = await User.findById(job.clientId).select('email firstName').lean();
        const proUser = await User.findById(req.user.id).select('email firstName').lean();
        await ensureJobSlug(job);
        if (clientUser?.email) {
          await sendTemplatedEmail(
            clientUser.email,
            'job-quote-received',
            {
              firstName: clientUser.firstName || 'There',
              jobTitle: job.title || 'Job',
              professionalName: professionalName || 'A professional',
              jobLink: jobLink(job),
              logoUrl: logoUrl(),
            },
            'job'
          );
        }
        if (proUser?.email) {
          await sendTemplatedEmail(
            proUser.email,
            'job-quote-sent',
            {
              firstName: proUser.firstName || 'There',
              jobTitle: job.title || 'Job',
              jobLink: jobLink(job),
              logoUrl: logoUrl(),
            },
            'job'
          );
        }
      } catch (e) {
        console.error('[Jobs] job-quote email error:', e);
      }
    })();
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
      job.awardPendingAt = new Date();
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
        const paymentSource = req.body.paymentSource === 'card' ? 'card' : 'wallet';
        const client = await User.findById(job.clientId).select(
          'walletBalance stripeCustomerId paymentMethods email firstName'
        );
        if (!client) return res.status(400).json({ error: 'Client not found' });

        const currentBalance = Number(client.walletBalance || 0);
        const walletDeduct = Math.min(currentBalance, totalMilestoneAmount);
        const externalShortfall = Math.max(0, totalMilestoneAmount - currentBalance);

        if (externalShortfall > 0 && paymentSource !== 'card') {
          return res.status(400).json({
            error: 'Insufficient wallet balance',
            code: 'INSUFFICIENT_BALANCE',
            required: totalMilestoneAmount,
            current: currentBalance,
          });
        }

        if (externalShortfall > 0 && paymentSource === 'card') {
          const paymentMethodId = req.body.paymentMethodId && String(req.body.paymentMethodId).trim();
          if (!paymentMethodId) {
            return res.status(400).json({ error: 'paymentMethodId is required for card payments' });
          }
          const settings = await PaymentSettings.getSettings();
          if (!settings.isActive) {
            return res.status(400).json({ error: 'Card payments are not available' });
          }
          let stripe;
          try {
            stripe = getStripeInstanceForJobs(settings);
          } catch (e) {
            return res.status(400).json({ error: e.message || 'Stripe is not configured' });
          }
          if (!client.stripeCustomerId) {
            return res.status(400).json({ error: 'Add a card in Billing before paying by card' });
          }
          const pm = (client.paymentMethods || []).find((p) => p.paymentMethodId === paymentMethodId);
          if (!pm) {
            return res.status(400).json({ error: 'Invalid or unknown payment method' });
          }

          const stripeCommissionPercentage = settings.stripeCommissionPercentage || 1.55;
          const stripeCommissionFixed = settings.stripeCommissionFixed || 0.29;
          const stripeCommission =
            (externalShortfall * stripeCommissionPercentage) / 100 + stripeCommissionFixed;
          const totalChargeAmount = externalShortfall + stripeCommission;

          let paymentIntent;
          try {
            paymentIntent = await stripe.paymentIntents.create({
              amount: Math.round(totalChargeAmount * 100),
              currency: 'gbp',
              customer: client.stripeCustomerId,
              payment_method: paymentMethodId,
              confirm: true,
              off_session: true,
              return_url: `${clientOrigin()}/account?tab=billing`,
              metadata: {
                userId: client._id.toString(),
                type: 'job_milestone_award',
                jobId: job._id.toString(),
                quoteId: quote._id.toString(),
                shortfallAmount: String(externalShortfall),
              },
            });
          } catch (err) {
            return res.status(400).json({
              error: err.message || 'Card payment failed',
              code: 'CARD_PAYMENT_FAILED',
            });
          }

          if (paymentIntent.status !== 'succeeded') {
            if (paymentIntent.status === 'requires_action') {
              return res.status(400).json({
                error:
                  'Your bank requires additional authentication. Fund your wallet from Billing and pay with account balance, or try another card.',
                code: 'CARD_REQUIRES_ACTION',
              });
            }
            return res.status(400).json({
              error: 'Payment not completed',
              code: 'CARD_INCOMPLETE',
              status: paymentIntent.status,
            });
          }

          client.walletBalance = Number(client.walletBalance || 0) + externalShortfall;
          await Wallet.create({
            userId: job.clientId,
            type: 'deposit',
            amount: externalShortfall,
            balance: client.walletBalance,
            status: 'completed',
            paymentMethod: 'card',
            stripePaymentIntentId: paymentIntent.id,
            stripeChargeId: paymentIntent.latest_charge || undefined,
            description: `Card funding for milestone shortfall — charged £${totalChargeAmount.toFixed(2)} (incl. fee)`,
            jobId: job._id,
            metadata: {
              source: 'job_milestone_award_card_shortfall',
              jobId: job._id.toString(),
              milestoneEscrowAmount: totalMilestoneAmount,
              shortfallAmount: externalShortfall,
              walletDeductAmount: walletDeduct,
              fee: stripeCommission,
              feePercentage: stripeCommissionPercentage,
              feeFixed: stripeCommissionFixed,
              totalCharged: totalChargeAmount,
            },
          });
        }

        client.walletBalance = Number(client.walletBalance || 0) - totalMilestoneAmount;
        await client.save();
        await Wallet.create({
          userId: job.clientId,
          type: 'payment',
          amount: totalMilestoneAmount,
          balance: client.walletBalance,
          status: 'completed',
          paymentMethod: 'wallet',
          description: `Job milestones - ${job.title || 'Job'}`,
          jobId: job._id,
          metadata: {
            jobId: job._id.toString(),
            source: 'job_milestones',
            walletDeductAmount: walletDeduct,
            externalShortfallAmount: externalShortfall,
            fundedViaCard: externalShortfall > 0 && paymentSource === 'card',
          },
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
        // Quote suggestions were realised as funded milestones at award; close pending rows so Payment tab does not offer duplicate acceptance.
        if (quote.suggestedMilestones?.length) {
          for (const sm of quote.suggestedMilestones) {
            if (sm.status === 'pending') sm.status = 'rejected';
          }
          job.markModified('quotes');
        }
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
    if (status === 'awarded') {
      (async () => {
        try {
          await ensureJobSlug(job);
          const clientUser = await User.findById(job.clientId).select('email firstName').lean();
          const proId = quote.professionalId?.toString?.();
          const proUser = proId ? await User.findById(proId).select('email firstName').lean() : null;
          const professionalName = quote.professionalName || proUser?.firstName || 'A professional';
          const clientName = clientUser?.firstName || 'The client';
          if (clientUser?.email) {
            await sendTemplatedEmail(
              clientUser.email,
              'job-awarded',
              {
                firstName: clientUser.firstName || 'There',
                jobTitle: job.title || 'Job',
                professionalName,
                jobLink: jobLink(job),
                logoUrl: logoUrl(),
              },
              'job'
            );
          }
          if (proUser?.email) {
            await sendTemplatedEmail(
              proUser.email,
              'job-award-received',
              {
                firstName: proUser.firstName || 'There',
                jobTitle: job.title || 'Job',
                clientName,
                jobLink: jobLink(job),
                logoUrl: logoUrl(),
              },
              'job'
            );
          }
          const firstMilestone = (job.milestones || [])[0];
          if (firstMilestone && (clientUser?.email || proUser?.email)) {
            const mName = firstMilestone.name || firstMilestone.description || 'Milestone';
            if (clientUser?.email) {
              await sendTemplatedEmail(
                clientUser.email,
                'job-milestone-created-client',
                {
                  firstName: clientUser.firstName || 'There',
                  jobTitle: job.title || 'Job',
                  milestoneName: mName,
                  jobLink: jobLink(job),
                  logoUrl: logoUrl(),
                },
                'job'
              );
            }
            if (proUser?.email) {
              await sendTemplatedEmail(
                proUser.email,
                'job-milestone-created-pro',
                {
                  firstName: proUser.firstName || 'There',
                  jobTitle: job.title || 'Job',
                  milestoneName: mName,
                  jobLink: jobLink(job),
                  logoUrl: logoUrl(),
                },
                'job'
              );
            }
          }
        } catch (e) {
          console.error('[Jobs] job-award/milestone email error:', e);
        }
      })();
    }
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
      try {
        const clientUser = await User.findById(job.clientId).select('email firstName').lean();
        const proId = job.awardedProfessionalId?.toString?.();
        const proUser = proId ? await User.findById(proId).select('email firstName').lean() : null;
        if (clientUser?.email || proUser?.email) {
          await ensureJobSlug(job);
          const mName = description;
          if (clientUser?.email) {
            await sendTemplatedEmail(clientUser.email, 'job-milestone-created-client', { firstName: clientUser.firstName || 'There', jobTitle: job.title || 'Job', milestoneName: mName, jobLink: jobLink(job), logoUrl: logoUrl() }, 'job');
          }
          if (proUser?.email) {
            await sendTemplatedEmail(proUser.email, 'job-milestone-created-pro', { firstName: proUser.firstName || 'There', jobTitle: job.title || 'Job', milestoneName: mName, jobLink: jobLink(job), logoUrl: logoUrl() }, 'job');
          }
        }
      } catch (e) {
        console.error('[Jobs] job-milestone-created email error:', e);
      }
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

// Professional: submit milestone payment plan after award without funded milestones (replaces any pending rows)
router.post('/:id/requested-milestones', authenticateToken, requireRole(['professional']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (!job.awardedProfessionalId || job.awardedProfessionalId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Only the awarded professional can submit a milestone plan' });
    }
    if (!['awaiting-accept', 'in-progress'].includes(job.status)) {
      return res.status(400).json({ error: 'Cannot submit a milestone plan in the current job status' });
    }
    if ((job.milestones || []).length > 0) {
      return res.status(400).json({ error: 'This job already has funded milestones' });
    }
    const raw = Array.isArray(req.body.milestones) ? req.body.milestones : [];
    if (raw.length === 0) {
      return res.status(400).json({ error: 'Add at least one milestone row' });
    }
    if (raw.length > 25) {
      return res.status(400).json({ error: 'At most 25 milestone rows allowed' });
    }
    const cleaned = [];
    for (const item of raw) {
      const description = item.description != null ? String(item.description).trim() : '';
      const amount = item.amount != null && !isNaN(Number(item.amount)) ? Number(item.amount) : NaN;
      if (!description) {
        return res.status(400).json({ error: 'Each milestone must have a description' });
      }
      if (amount == null || amount <= 0) {
        return res.status(400).json({ error: 'Each milestone must have a positive amount' });
      }
      cleaned.push({ description, amount });
    }
    job.requestedMilestonePlan = job.requestedMilestonePlan || [];
    for (const row of job.requestedMilestonePlan) {
      if (row.status === 'pending') row.status = 'rejected';
    }
    for (const c of cleaned) {
      job.requestedMilestonePlan.push({
        description: c.description,
        amount: c.amount,
        status: 'pending',
      });
    }
    job.markModified('requestedMilestonePlan');
    await job.save();
    emitJobUpdated(job);
    try {
      await ensureJobSlug(job);
      const clientUser = await User.findById(job.clientId).select('email firstName').lean();
      const proUser = await User.findById(req.user.id).select('firstName tradingName').lean();
      const proName =
        proUser?.tradingName ||
        proUser?.firstName ||
        'The professional';
      if (clientUser?.email) {
        await sendTemplatedEmail(
          clientUser.email,
          'job-milestone-plan-request-client',
          {
            firstName: clientUser.firstName || 'There',
            jobTitle: job.title || 'Job',
            professionalName: proName,
            jobLink: jobLink(job),
            logoUrl: logoUrl(),
          },
          'job',
        );
      }
    } catch (e) {
      console.error('[Jobs] job-milestone-plan-request-client email error:', e);
    }
    return res.json(toJobResponse(job));
  } catch (err) {
    console.error('[Jobs] Submit requested milestones error:', err);
    return res.status(500).json({ error: err.message || 'Failed to submit milestone plan' });
  }
});

// Client: accept one row from professional's requested milestone plan -> funded milestone
router.post(
  '/:id/requested-milestones/:requestId/accept',
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
        return res.status(400).json({ error: 'Cannot accept requested milestones in the current job status' });
      }
      if (!job.awardedProfessionalId) {
        return res.status(400).json({ error: 'No awarded professional for this job' });
      }
      const row = (job.requestedMilestonePlan || []).find(
        (m) => m._id.toString() === req.params.requestId,
      );
      if (!row) return res.status(404).json({ error: 'Requested milestone not found' });
      if (row.status === 'accepted') {
        return res.status(400).json({ error: 'This milestone request is already accepted' });
      }
      if (row.status === 'rejected') {
        return res.status(400).json({ error: 'This milestone request was declined' });
      }
      const numAmount = row.amount != null && !isNaN(Number(row.amount)) ? Number(row.amount) : null;
      if (numAmount == null || numAmount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }
      const description = (row.description && String(row.description).trim()) || 'Milestone';

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
        metadata: { jobId: job._id.toString(), source: 'job_requested_milestone' },
      });

      job.milestones = job.milestones || [];
      const newMilestoneStatus = job.status === 'in-progress' ? 'in-progress' : 'awaiting-accept';
      job.milestones.push({
        name: description,
        description,
        amount: numAmount,
        status: newMilestoneStatus,
      });

      row.status = 'accepted';
      job.markModified('milestones');
      job.markModified('requestedMilestonePlan');
      await job.save();
      emitJobUpdated(job);
      try {
        const clientUser = await User.findById(job.clientId).select('email firstName').lean();
        const proId = job.awardedProfessionalId?.toString?.();
        const proUser = proId ? await User.findById(proId).select('email firstName').lean() : null;
        if (clientUser?.email || proUser?.email) {
          await ensureJobSlug(job);
          const mName = description;
          if (clientUser?.email) {
            await sendTemplatedEmail(
              clientUser.email,
              'job-milestone-created-client',
              {
                firstName: clientUser.firstName || 'There',
                jobTitle: job.title || 'Job',
                milestoneName: mName,
                jobLink: jobLink(job),
                logoUrl: logoUrl(),
              },
              'job',
            );
          }
          if (proUser?.email) {
            await sendTemplatedEmail(
              proUser.email,
              'job-milestone-created-pro',
              {
                firstName: proUser.firstName || 'There',
                jobTitle: job.title || 'Job',
                milestoneName: mName,
                jobLink: jobLink(job),
                logoUrl: logoUrl(),
              },
              'job',
            );
          }
        }
      } catch (e) {
        console.error('[Jobs] job-milestone-created email error:', e);
      }
      return res.json(toJobResponse(job));
    } catch (err) {
      console.error('[Jobs] Accept requested milestone error:', err);
      return res.status(500).json({ error: err.message || 'Failed to accept requested milestone' });
    }
  },
);

// Client: reject one row from professional's requested milestone plan
router.post(
  '/:id/requested-milestones/:requestId/reject',
  authenticateToken,
  requireRole(['client']),
  async (req, res) => {
    try {
      const job = await Job.findById(req.params.id);
      if (!job) return res.status(404).json({ error: 'Job not found' });
      if (job.clientId.toString() !== req.user.id) {
        return res.status(403).json({ error: 'Not allowed to update this job' });
      }
      const row = (job.requestedMilestonePlan || []).find(
        (m) => m._id.toString() === req.params.requestId,
      );
      if (!row) return res.status(404).json({ error: 'Requested milestone not found' });
      if (row.status === 'accepted') {
        return res.status(400).json({ error: 'This milestone request is already accepted' });
      }
      if (row.status === 'rejected') {
        return res.status(400).json({ error: 'This milestone request is already declined' });
      }
      row.status = 'rejected';
      job.markModified('requestedMilestonePlan');
      await job.save();
      emitJobUpdated(job);
      return res.json(toJobResponse(job));
    } catch (err) {
      console.error('[Jobs] Reject requested milestone error:', err);
      return res.status(500).json({ error: err.message || 'Failed to reject requested milestone' });
    }
  },
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
    job.awardPendingAt = null;
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
    await revertJobAwardToOpen(job, { walletMetadataSource: 'job_award_rejected' });
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
    for (const row of job.requestedMilestonePlan || []) {
      if (row.status === 'pending') row.status = 'rejected';
    }
    job.markModified('milestones');
    job.markModified('requestedMilestonePlan');
    await job.save();
    emitJobUpdated(job);
    try {
      const clientUser = await User.findById(job.clientId).select('email firstName').lean();
      const proId = job.awardedProfessionalId?.toString?.();
      const proUser = proId ? await User.findById(proId).select('email firstName').lean() : null;
      if (clientUser?.email || proUser?.email) {
        await ensureJobSlug(job);
        if (clientUser?.email) {
          await sendTemplatedEmail(
            clientUser.email,
            'job-milestone-created-client',
            {
              firstName: clientUser.firstName || 'There',
              jobTitle: job.title || 'Job',
              milestoneName,
              jobLink: jobLink(job),
              logoUrl: logoUrl(),
            },
            'job',
          );
        }
        if (proUser?.email) {
          await sendTemplatedEmail(
            proUser.email,
            'job-milestone-created-pro',
            {
              firstName: proUser.firstName || 'There',
              jobTitle: job.title || 'Job',
              milestoneName,
              jobLink: jobLink(job),
              logoUrl: logoUrl(),
            },
            'job',
          );
        }
      }
    } catch (e) {
      console.error('[Jobs] job-milestone-created email error:', e);
    }
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
    if (milestone.status !== 'in-progress' && milestone.status !== 'delivered') {
      return res.status(400).json({ error: 'Only in-progress or delivered milestones can be released' });
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
      if (!job.completedAt) job.completedAt = new Date();
    }
    await job.save();
    emitJobUpdated(job);
    try {
      await ensureJobSlug(job);
      const mName = milestone.name || milestone.description || 'Milestone';
      const clientUser = await User.findById(job.clientId).select('email firstName').lean();
      const proId = job.awardedProfessionalId?.toString?.();
      const proUser = proId ? await User.findById(proId).select('email firstName').lean() : null;
      const professionalName = proUser?.firstName || 'The professional';
      if (clientUser?.email) {
        await sendTemplatedEmail(
          clientUser.email,
          'job-milestone-released-client',
          {
            firstName: clientUser.firstName || 'There',
            jobTitle: job.title || 'Job',
            milestoneName: mName,
            jobLink: jobLink(job),
            logoUrl: logoUrl(),
          },
          'job',
        );
      }
      if (proUser?.email) {
        await sendTemplatedEmail(
          proUser.email,
          'job-milestone-released-pro',
          {
            firstName: proUser.firstName || 'There',
            jobTitle: job.title || 'Job',
            milestoneName: mName,
            jobLink: jobLink(job),
            logoUrl: logoUrl(),
          },
          'job',
        );
      }
      if (job.status === 'completed') {
        if (clientUser?.email) {
          await sendTemplatedEmail(
            clientUser.email,
            'job-completed-client',
            {
              firstName: clientUser.firstName || 'There',
              jobTitle: job.title || 'Job',
              professionalName,
              jobLink: jobLink(job),
              logoUrl: logoUrl(),
            },
            'job',
          );
        }
        if (proUser?.email) {
          await sendTemplatedEmail(
            proUser.email,
            'job-completed-pro',
            {
              firstName: proUser.firstName || 'There',
              jobTitle: job.title || 'Job',
              jobLink: jobLink(job),
              logoUrl: logoUrl(),
            },
            'job',
          );
        }
      }
    } catch (e) {
      console.error('[Jobs] job-milestone-released/completed email error:', e);
    }
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
    try {
      const isClientRequester = job.clientId.toString() === req.user.id;
      if (isClientRequester) {
        const proId = job.awardedProfessionalId?.toString?.();
        const proUser = proId ? await User.findById(proId).select('email firstName').lean() : null;
        const clientUser = await User.findById(job.clientId).select('firstName').lean();
        if (proUser?.email) {
          await ensureJobSlug(job);
          const mName = milestone.name || milestone.description || 'Milestone';
          await sendTemplatedEmail(
            proUser.email,
            'job-milestone-cancel-request-received',
            {
              firstName: proUser.firstName || 'There',
              jobTitle: job.title || 'Job',
              milestoneName: mName,
              clientName: clientUser?.firstName || 'The client',
              jobLink: jobLink(job),
              logoUrl: logoUrl(),
            },
            'job'
          );
        }
      }
    } catch (e) {
      console.error('[Jobs] job-milestone-cancel-request-received email error:', e);
    }
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
      const refundAmount = Number(milestone.amount) || 0;
      if (refundAmount > 0) {
        const client = await User.findById(job.clientId).select('walletBalance');
        if (client) {
          client.walletBalance = (client.walletBalance || 0) + refundAmount;
          await client.save();
          const milestoneName = milestone.name || milestone.description || 'Milestone';
          await Wallet.create({
            userId: job.clientId,
            type: 'refund',
            amount: refundAmount,
            balance: client.walletBalance,
            status: 'completed',
            paymentMethod: 'wallet',
            description: `Milestone cancellation refund - ${job.title || 'Job'} - ${milestoneName}`,
            jobId: job._id,
            milestoneId: milestone._id.toString(),
            metadata: {
              source: 'job_milestone_cancel_refund',
              jobSlug: job.slug || job._id.toString(),
              jobTitle: job.title || 'Job',
              milestoneName,
              refundedByResponseUserId: req.user.id,
            },
          });
        }
      }
      milestone.status = 'cancelled';
      milestone.cancelRequestStatus = 'accepted';
      milestone.cancelRequestedAt = null;
      milestone.cancelRequestedBy = null;
      milestone.cancelRequestReason = null;
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

// Client: close a milestone-only project when all milestones are cancelled
router.post('/:id/close-project', authenticateToken, requireRole(['client']), async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (job.clientId.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not allowed to close this project' });
    }
    if (!job.awardedProfessionalId) {
      return res.status(400).json({ error: 'Only awarded jobs can be closed as a project' });
    }
    if (job.status !== 'in-progress') {
      return res.status(400).json({ error: 'Only in-progress jobs can be closed' });
    }
    const milestones = Array.isArray(job.milestones) ? job.milestones : [];
    if (milestones.length === 0) {
      return res.status(400).json({ error: 'No milestones found for this project' });
    }
    const allCancelled = milestones.every((m) => m.status === 'cancelled');
    if (!allCancelled) {
      return res.status(400).json({ error: 'All milestones must be cancelled before closing project' });
    }

    job.status = 'closed';
    await job.save();
    emitJobUpdated(job);
    res.json(toJobResponse(job));
  } catch (err) {
    console.error('[Jobs] Close project error:', err);
    res.status(500).json({ error: err.message || 'Failed to close project' });
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
    try {
      const clientUser = await User.findById(job.clientId).select('email firstName').lean();
      const proUser = await User.findById(req.user.id).select('firstName').lean();
      if (clientUser?.email) {
        await ensureJobSlug(job);
        const mName = milestone.name || milestone.description || 'Milestone';
        await sendTemplatedEmail(
          clientUser.email,
          'job-milestone-release-request-received',
          {
            firstName: clientUser.firstName || 'There',
            jobTitle: job.title || 'Job',
            milestoneName: mName,
            professionalName: proUser?.firstName || 'The professional',
            jobLink: jobLink(job),
            logoUrl: logoUrl(),
          },
          'job'
        );
      }
    } catch (e) {
      console.error('[Jobs] job-milestone-release-request-received email error:', e);
    }
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
      if (!job.completedAt) job.completedAt = new Date();
    }
    await job.save();
    emitJobUpdated(job);
    if (accept === true) {
      try {
        await ensureJobSlug(job);
        const mName = milestone.name || milestone.description || 'Milestone';
        const clientUser = await User.findById(job.clientId).select('email firstName').lean();
        const proId = job.awardedProfessionalId?.toString?.();
        const proUser = proId ? await User.findById(proId).select('email firstName').lean() : null;
        const professionalName = proUser?.firstName || 'The professional';
        if (clientUser?.email) {
          await sendTemplatedEmail(clientUser.email, 'job-milestone-released-client', { firstName: clientUser.firstName || 'There', jobTitle: job.title || 'Job', milestoneName: mName, jobLink: jobLink(job), logoUrl: logoUrl() }, 'job');
        }
        if (proUser?.email) {
          await sendTemplatedEmail(proUser.email, 'job-milestone-released-pro', { firstName: proUser.firstName || 'There', jobTitle: job.title || 'Job', milestoneName: mName, jobLink: jobLink(job), logoUrl: logoUrl() }, 'job');
        }
        if (job.status === 'completed') {
          if (clientUser?.email) {
            await sendTemplatedEmail(clientUser.email, 'job-completed-client', { firstName: clientUser.firstName || 'There', jobTitle: job.title || 'Job', professionalName, jobLink: jobLink(job), logoUrl: logoUrl() }, 'job');
          }
          if (proUser?.email) {
            await sendTemplatedEmail(proUser.email, 'job-completed-pro', { firstName: proUser.firstName || 'There', jobTitle: job.title || 'Job', jobLink: jobLink(job), logoUrl: logoUrl() }, 'job');
          }
        }
      } catch (e) {
        console.error('[Jobs] job-milestone-released/completed email error (respond-release):', e);
      }
    }
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
    const { milestoneId, reason, evidence, requirements, unmetRequirements, offerAmount } = req.body;
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
    const settings = await PaymentSettings.getSettings();
    const responseTimeHoursRaw = typeof settings.disputeResponseTimeHours === 'number'
      ? settings.disputeResponseTimeHours
      : parseFloat(settings.disputeResponseTimeHours || '0');
    const responseTimeHours = Number.isFinite(responseTimeHoursRaw) && responseTimeHoursRaw > 0
      ? responseTimeHoursRaw
      : 48;
    const responseDeadline = new Date(Date.now() + responseTimeHours * 60 * 60 * 1000);
    const parsedOfferAmount = offerAmount === undefined || offerAmount === null || offerAmount === ''
      ? 0
      : Number(offerAmount);
    const milestoneAmount = Number(milestone.amount) || 0;
    if (Number.isFinite(parsedOfferAmount) && parsedOfferAmount > milestoneAmount) {
      return res.status(400).json({ error: `Offer amount cannot exceed milestone amount (£${milestoneAmount.toFixed(2)})` });
    }
    const user = await User.findById(req.user.id).select('firstName lastName tradingName avatar').lean();
    const userName = isClient
      ? [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Client'
      : user?.tradingName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'Professional';

    const dispute = new JobDispute({
      jobId: job._id,
      milestoneId: milestone._id,
      createdBy: claimantId,
      claimantId,
      respondentId,
      reason: String(reason).trim(),
      requirements: requirements ? String(requirements).trim() : '',
      unmetRequirements: unmetRequirements ? String(unmetRequirements).trim() : '',
      evidence: evidence ? String(evidence).trim() : null,
      amount: milestoneAmount,
      status: 'open',
      responseDeadline,
      offers: {
        clientOffer: isClient ? (Number.isFinite(parsedOfferAmount) ? parsedOfferAmount : null) : null,
        professionalOffer: !isClient ? (Number.isFinite(parsedOfferAmount) ? parsedOfferAmount : null) : null,
      },
      messages: [{
        userId: req.user.id,
        userName,
        userAvatar: user?.avatar || '',
        message: String(reason).trim(),
        timestamp: new Date(),
        isTeamResponse: false,
      }],
    });
    await dispute.save();

    milestone.status = 'disputed';
    milestone.disputeId = dispute._id;
    job.markModified('milestones');
    await job.save();
    emitJobUpdated(job);

    try {
      await ensureJobSlug(job);
      const mName = milestone.name || milestone.description || 'Milestone';
      const clientUser = await User.findById(job.clientId).select('email firstName').lean();
      const proId = job.awardedProfessionalId?.toString?.();
      const proUser = proId ? await User.findById(proId).select('email firstName').lean() : null;
      const reasonText = String(reason).trim();
      if (isClient) {
        if (clientUser?.email) {
          await sendTemplatedEmail(clientUser.email, 'job-dispute-opened-by-me-client', { firstName: clientUser.firstName || 'There', jobTitle: job.title || 'Job', milestoneName: mName, jobLink: jobLink(job), logoUrl: logoUrl() }, 'job');
        }
        if (proUser?.email) {
          await sendTemplatedEmail(proUser.email, 'job-dispute-opened-by-client', { firstName: proUser.firstName || 'There', jobTitle: job.title || 'Job', milestoneName: mName, clientName: clientUser?.firstName || 'The client', reason: reasonText, jobLink: jobLink(job), logoUrl: logoUrl() }, 'job');
        }
      } else {
        if (proUser?.email) {
          await sendTemplatedEmail(proUser.email, 'job-dispute-opened-by-me-pro', { firstName: proUser.firstName || 'There', jobTitle: job.title || 'Job', milestoneName: mName, jobLink: jobLink(job), logoUrl: logoUrl() }, 'job');
        }
        if (clientUser?.email) {
          await sendTemplatedEmail(clientUser.email, 'job-dispute-opened-by-other', { firstName: clientUser.firstName || 'There', jobTitle: job.title || 'Job', milestoneName: mName, otherPartyName: proUser?.firstName || 'The professional', reason: reasonText, jobLink: jobLink(job), logoUrl: logoUrl() }, 'job');
        }
      }
    } catch (e) {
      console.error('[Jobs] job-dispute email error:', e);
    }

    const jobRes = toJobResponse(job);
    const disputeRes = mapJobDisputeResponse(dispute);
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
    const list = disputes.map((d) => mapJobDisputeResponse(d));
    res.json({ disputes: list });
  } catch (err) {
    console.error('[Jobs] List disputes error:', err);
    res.status(500).json({ error: err.message || 'Failed to list disputes' });
  }
});

// Get single dispute for a job
router.get('/:id/disputes/:disputeId', authenticateToken, async (req, res) => {
  try {
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const isClient = job.clientId.toString() === req.user.id;
    const isPro = job.awardedProfessionalId && job.awardedProfessionalId.toString() === req.user.id;
    if (!isClient && !isPro && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not allowed to view this dispute' });
    }
    const dispute = await JobDispute.findById(req.params.disputeId).lean();
    if (!dispute || dispute.jobId.toString() !== job._id.toString()) {
      return res.status(404).json({ error: 'Dispute not found' });
    }
    res.json({ dispute: mapJobDisputeResponse(dispute) });
  } catch (err) {
    console.error('[Jobs] Get dispute error:', err);
    res.status(500).json({ error: err.message || 'Failed to get dispute' });
  }
});

// Get single job dispute by dispute id (for deep links)
router.get('/disputes/:disputeId', authenticateToken, async (req, res) => {
  try {
    const dispute = await JobDispute.findById(req.params.disputeId).lean();
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
    const job = await Job.findById(dispute.jobId).lean();
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const isClient = job.clientId?.toString() === req.user.id;
    const isPro = job.awardedProfessionalId?.toString() === req.user.id;
    if (!isClient && !isPro && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not allowed to view this dispute' });
    }
    res.json({
      dispute: mapJobDisputeResponse(dispute),
      job: toJobResponse(job),
    });
  } catch (err) {
    console.error('[Jobs] Get dispute by id error:', err);
    res.status(500).json({ error: err.message || 'Failed to get dispute' });
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
    if (dispute.status !== 'open' && dispute.status !== 'negotiation') {
      return res.status(400).json({ error: 'This dispute is closed' });
    }
    const isRespondent = dispute.respondentId?.toString() === req.user.id;
    if (isRespondent && !dispute.respondedAt) {
      if (dispute.responseDeadline && new Date(dispute.responseDeadline) < new Date()) {
        return res.status(400).json({ error: 'The response deadline has passed' });
      }
      const settings = await PaymentSettings.getSettings();
      const stepInHours = typeof settings.stepInHours === 'number' && settings.stepInHours >= 0
        ? settings.stepInHours
        : (typeof settings.stepInDays === 'number' && settings.stepInDays > 0 ? settings.stepInDays * 24 : null);
      const negotiationTimeHours = settings.disputeNegotiationTimeHours || 72;
      const negotiationDeadline = new Date();
      if (typeof stepInHours === 'number' && stepInHours > 0) {
        negotiationDeadline.setTime(negotiationDeadline.getTime() + stepInHours * 60 * 60 * 1000);
      } else {
        negotiationDeadline.setHours(negotiationDeadline.getHours() + negotiationTimeHours);
      }
      dispute.status = 'negotiation';
      dispute.respondedAt = new Date();
      dispute.negotiationDeadline = negotiationDeadline;
      dispute.arbitrationFeeAmount = typeof settings.stepInAmount === 'number' ? settings.stepInAmount : dispute.arbitrationFeeAmount;
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
    const disputeRes = mapJobDisputeResponse(updated);
    res.json(disputeRes);
  } catch (err) {
    console.error('[Jobs] Add dispute message error:', err);
    res.status(500).json({ error: err.message || 'Failed to add message' });
  }
});

// Respond to job dispute
router.post('/:id/disputes/:disputeId/respond', authenticateToken, async (req, res) => {
  try {
    const { message } = req.body || {};
    const dispute = await JobDispute.findById(req.params.disputeId);
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
    if (dispute.jobId.toString() !== req.params.id) return res.status(404).json({ error: 'Dispute not found for this job' });
    if (dispute.status !== 'open') return res.status(400).json({ error: 'This dispute is no longer open' });
    if (dispute.respondentId?.toString() !== req.user.id) return res.status(403).json({ error: 'Only respondent can respond' });
    if (dispute.responseDeadline && new Date(dispute.responseDeadline) < new Date()) {
      return res.status(400).json({ error: 'The response deadline has passed' });
    }
    const settings = await PaymentSettings.getSettings();
    const stepInHours = typeof settings.stepInHours === 'number' && settings.stepInHours >= 0
      ? settings.stepInHours
      : (typeof settings.stepInDays === 'number' && settings.stepInDays > 0 ? settings.stepInDays * 24 : null);
    const negotiationTimeHours = settings.disputeNegotiationTimeHours || 72;
    const negotiationDeadline = new Date();
    if (typeof stepInHours === 'number' && stepInHours > 0) {
      negotiationDeadline.setTime(negotiationDeadline.getTime() + stepInHours * 60 * 60 * 1000);
    } else {
      negotiationDeadline.setHours(negotiationDeadline.getHours() + negotiationTimeHours);
    }
    if (message && String(message).trim()) {
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
    }
    dispute.status = 'negotiation';
    dispute.respondedAt = new Date();
    dispute.negotiationDeadline = negotiationDeadline;
    dispute.arbitrationFeeAmount = typeof settings.stepInAmount === 'number' ? settings.stepInAmount : dispute.arbitrationFeeAmount;
    await dispute.save();
    res.json({ message: 'Dispute response submitted successfully', dispute: mapJobDisputeResponse(dispute) });
  } catch (err) {
    console.error('[Jobs] Respond dispute error:', err);
    res.status(500).json({ error: err.message || 'Failed to respond to dispute' });
  }
});

// Submit/Update job dispute offer
router.post('/:id/disputes/:disputeId/offer', authenticateToken, async (req, res) => {
  try {
    const parsedAmount = Number(req.body?.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount < 0) return res.status(400).json({ error: 'Invalid offer amount' });
    const dispute = await JobDispute.findById(req.params.disputeId);
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
    if (dispute.jobId.toString() !== req.params.id) return res.status(404).json({ error: 'Dispute not found for this job' });
    if (!['open', 'negotiation'].includes(dispute.status)) return res.status(400).json({ error: 'Cannot submit offer for a closed dispute' });
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const isClient = job.clientId.toString() === req.user.id;
    const isPro = job.awardedProfessionalId?.toString() === req.user.id;
    if (!isClient && !isPro) return res.status(403).json({ error: 'Not allowed' });
    const milestone = (job.milestones || []).find((m) => m._id.toString() === dispute.milestoneId?.toString());
    const maxAmount = Number(milestone?.amount ?? dispute.amount ?? 0);
    if (parsedAmount > maxAmount) return res.status(400).json({ error: `Offer amount cannot exceed milestone amount (£${maxAmount.toFixed(2)})` });
    if (!dispute.offers) dispute.offers = { clientOffer: null, professionalOffer: null };
    if (isClient) {
      const prev = dispute.offers.clientOffer;
      if (typeof prev === 'number' && parsedAmount < prev) return res.status(400).json({ error: `You cannot decrease your offer. Your current offer is £${prev.toFixed(2)}` });
      dispute.offers.clientOffer = parsedAmount;
    } else {
      const prev = dispute.offers.professionalOffer;
      if (typeof prev === 'number' && parsedAmount > prev) return res.status(400).json({ error: `You cannot increase your offer. Your current offer is £${prev.toFixed(2)}` });
      dispute.offers.professionalOffer = parsedAmount;
    }
    dispute.offerHistory = dispute.offerHistory || [];
    dispute.offerHistory.push({ role: isClient ? 'client' : 'professional', amount: parsedAmount, offeredAt: new Date(), userId: req.user.id });
    dispute.lastOfferRejectedAt = null;
    dispute.lastOfferRejectedBy = null;
    dispute.lastOfferRejectedByRole = null;
    dispute.lastRejectedOfferAmount = null;
    const clientOffer = dispute.offers.clientOffer;
    const proOffer = dispute.offers.professionalOffer;
    if (typeof clientOffer === 'number' && typeof proOffer === 'number' && clientOffer === proOffer) {
      dispute.status = 'closed';
      dispute.closedAt = new Date();
      dispute.finalAmount = clientOffer;
      dispute.decisionNotes = `Dispute resolved as both parties agreed on £${clientOffer.toFixed(2)}.`;
      await applyJobDisputeSettlement({ job, dispute, agreedAmount: clientOffer });
    }
    await dispute.save();
    emitJobUpdated(job);
    res.json({ message: 'Offer submitted successfully', dispute: mapJobDisputeResponse(dispute) });
  } catch (err) {
    console.error('[Jobs] Submit dispute offer error:', err);
    res.status(500).json({ error: err.message || 'Failed to submit offer' });
  }
});

router.post('/:id/disputes/:disputeId/accept', authenticateToken, async (req, res) => {
  try {
    const dispute = await JobDispute.findById(req.params.disputeId);
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (dispute.jobId.toString() !== job._id.toString()) return res.status(404).json({ error: 'Dispute not found for this job' });
    if (!['open', 'negotiation'].includes(dispute.status)) return res.status(400).json({ error: 'This dispute is already closed' });
    const isClient = job.clientId.toString() === req.user.id;
    const isPro = job.awardedProfessionalId?.toString() === req.user.id;
    if (!isClient && !isPro) return res.status(403).json({ error: 'Not allowed' });
    const agreedAmount = isClient ? dispute.offers?.professionalOffer : dispute.offers?.clientOffer;
    if (agreedAmount == null) return res.status(400).json({ error: 'The other party has not made an offer yet' });
    dispute.status = 'closed';
    dispute.closedAt = new Date();
    dispute.acceptedBy = req.user.id;
    dispute.acceptedByRole = isClient ? 'client' : 'professional';
    dispute.acceptedAt = new Date();
    dispute.finalAmount = agreedAmount;
    dispute.decisionNotes = `Dispute resolved by accepted offer (£${Number(agreedAmount).toFixed(2)}).`;
    await applyJobDisputeSettlement({ job, dispute, agreedAmount });
    await dispute.save();
    emitJobUpdated(job);
    res.json({ message: 'Dispute resolved successfully', dispute: mapJobDisputeResponse(dispute) });
  } catch (err) {
    console.error('[Jobs] Accept dispute offer error:', err);
    res.status(500).json({ error: err.message || 'Failed to accept dispute offer' });
  }
});

router.post('/:id/disputes/:disputeId/reject', authenticateToken, async (req, res) => {
  try {
    const note = req.body?.message;
    const dispute = await JobDispute.findById(req.params.disputeId);
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const isClient = job.clientId.toString() === req.user.id;
    const isPro = job.awardedProfessionalId?.toString() === req.user.id;
    if (!isClient && !isPro) return res.status(403).json({ error: 'Not allowed' });
    if (!['open', 'negotiation'].includes(dispute.status)) return res.status(400).json({ error: 'This dispute is already closed' });
    const rejectedOfferAmount = isClient ? dispute.offers?.professionalOffer : dispute.offers?.clientOffer;
    if (!dispute.offers) dispute.offers = { clientOffer: null, professionalOffer: null };
    if (isClient) dispute.offers.professionalOffer = null;
    else dispute.offers.clientOffer = null;
    dispute.lastOfferRejectedAt = new Date();
    dispute.lastOfferRejectedBy = req.user.id;
    dispute.lastOfferRejectedByRole = isClient ? 'client' : 'professional';
    dispute.lastRejectedOfferAmount = rejectedOfferAmount ?? null;
    const user = await User.findById(req.user.id).select('firstName lastName tradingName avatar').lean();
    const userName = user?.tradingName || [user?.firstName, user?.lastName].filter(Boolean).join(' ') || 'User';
    dispute.messages = dispute.messages || [];
    dispute.messages.push({
      userId: req.user.id,
      userName,
      userAvatar: user?.avatar || '',
      message: note && String(note).trim()
        ? `Rejected the £${Number(rejectedOfferAmount || 0).toFixed(2)} offer. ${String(note).trim()}`
        : `Rejected the £${Number(rejectedOfferAmount || 0).toFixed(2)} offer.`,
      timestamp: new Date(),
      isTeamResponse: false,
    });
    await dispute.save();
    res.json({ message: 'Offer rejected', dispute: mapJobDisputeResponse(dispute) });
  } catch (err) {
    console.error('[Jobs] Reject dispute offer error:', err);
    res.status(500).json({ error: err.message || 'Failed to reject dispute offer' });
  }
});

router.post('/:id/disputes/:disputeId/request-arbitration', authenticateToken, async (req, res) => {
  try {
    const { paymentMethod, paymentMethodId } = req.body || {};
    if (!paymentMethod || !['account_balance', 'wallet', 'card', 'paypal'].includes(paymentMethod)) {
      return res.status(400).json({ error: 'Invalid payment method' });
    }
    const dispute = await JobDispute.findById(req.params.disputeId);
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (dispute.status !== 'negotiation') return res.status(400).json({ error: 'Dispute must be in negotiation phase to request arbitration' });
    const isParty = dispute.claimantId?.toString() === req.user.id || dispute.respondentId?.toString() === req.user.id;
    if (!isParty) return res.status(403).json({ error: 'Only parties involved in the dispute can request arbitration' });
    const existingPayment = (dispute.arbitrationPayments || []).find((p) => p.userId?.toString() === req.user.id);
    if (existingPayment) return res.status(400).json({ error: 'You have already paid the arbitration fee for this dispute' });
    const settings = await PaymentSettings.getSettings();
    const arbitrationFee = typeof settings.stepInAmount === 'number' ? settings.stepInAmount : 0;
    const requestingUser = await User.findById(req.user.id).select('walletBalance');
    if (!requestingUser) return res.status(404).json({ error: 'User not found' });
    const normalizedMethod = paymentMethod === 'wallet' ? 'account_balance' : paymentMethod;
    let feeTransaction = null;
    let paymentIntentId = null;

    if (normalizedMethod === 'account_balance') {
      if ((requestingUser.walletBalance || 0) < arbitrationFee) {
        return res.status(400).json({ error: `Insufficient balance. Arbitration fee is £${arbitrationFee.toFixed(2)}.` });
      }
      requestingUser.walletBalance = (requestingUser.walletBalance || 0) - arbitrationFee;
      await requestingUser.save();
      feeTransaction = await Wallet.create({
        userId: requestingUser._id,
        type: 'payment',
        amount: arbitrationFee,
        balance: requestingUser.walletBalance,
        status: 'completed',
        paymentMethod: 'wallet',
        jobId: job._id,
        milestoneId: dispute.milestoneId?.toString(),
        description: `Dispute arbitration fee - ${job.title || 'Job'}`,
        metadata: { source: 'job_dispute_arbitration_fee', disputeId: dispute._id?.toString(), paymentMethod: 'wallet' },
      });
    } else if (normalizedMethod === 'card') {
      if (!paymentMethodId) {
        return res.status(400).json({ error: 'Payment method ID is required for card payments' });
      }
      const settingsStripe = await PaymentSettings.getSettings();
      const stripe = getStripeInstanceForJobs(settingsStripe);
      const paymentIntent = await stripe.paymentIntents.create({
        amount: Math.round(arbitrationFee * 100),
        currency: 'gbp',
        payment_method: paymentMethodId,
        customer: requestingUser.stripeCustomerId,
        confirm: true,
        return_url: `${req.headers.origin || 'http://localhost:5000'}/account`,
        metadata: {
          userId: requestingUser._id.toString(),
          type: 'job_dispute_arbitration_fee',
          disputeId: dispute._id.toString(),
          jobId: job._id.toString(),
        },
      });
      if (paymentIntent.status !== 'succeeded') {
        return res.status(400).json({
          error: 'Payment failed',
          status: paymentIntent.status,
          requiresAction: paymentIntent.status === 'requires_action',
        });
      }
      paymentIntentId = paymentIntent.id;
      feeTransaction = await Wallet.create({
        userId: requestingUser._id,
        type: 'payment',
        amount: arbitrationFee,
        balance: requestingUser.walletBalance || 0,
        status: 'completed',
        paymentMethod: 'card',
        jobId: job._id,
        milestoneId: dispute.milestoneId?.toString(),
        description: `Dispute arbitration fee - ${job.title || 'Job'}`,
        metadata: { source: 'job_dispute_arbitration_fee', disputeId: dispute._id?.toString(), paymentMethod: 'card', paymentIntentId },
      });
    } else if (normalizedMethod === 'paypal') {
      const settingsPaypal = await PaymentSettings.getSettings();
      const environment = getPayPalClientForJobs(settingsPaypal);
      const client = new paypal.core.PayPalHttpClient(environment);
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      const origin = req.headers.origin || 'http://localhost:5000';
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'GBP', value: arbitrationFee.toFixed(2) },
          description: `Dispute arbitration fee - ${job.title || 'Job'}`,
          custom_id: `job-dispute-arbitration-${job._id}-${req.user.id}`,
        }],
        application_context: {
          return_url: `${origin}/disputes/${dispute._id}?paypalCapture=1&jobId=${encodeURIComponent(job._id.toString())}`,
          cancel_url: `${origin}/disputes/${dispute._id}`,
          brand_name: 'Sortars UK',
          locale: 'en-GB',
        },
      });
      const paypalApiOrder = await client.execute(request);
      if (paypalApiOrder.statusCode !== 201) {
        return res.status(400).json({ error: 'Failed to create PayPal order' });
      }
      const paypalOrderId = paypalApiOrder.result.id;
      const approveUrl = paypalApiOrder.result.links.find((link) => link.rel === 'approve')?.href;
      if (!approveUrl) return res.status(400).json({ error: 'Failed to get PayPal approval URL' });
      dispute.pendingPayPalArbitration = {
        paypalOrderId,
        userId: requestingUser._id,
        amount: arbitrationFee,
        createdAt: new Date(),
      };
      await dispute.save();
      return res.json({
        message: 'Redirect to PayPal to complete arbitration fee payment.',
        requiresRedirect: true,
        approveUrl,
        paypalOrderId,
      });
    }
    dispute.arbitrationFeeAmount = arbitrationFee;
    dispute.arbitrationPayments = dispute.arbitrationPayments || [];
    dispute.arbitrationPayments.push({
      userId: requestingUser._id,
      amount: arbitrationFee,
      paidAt: new Date(),
      paymentMethod: normalizedMethod === 'account_balance' ? 'wallet' : normalizedMethod,
      paymentIntentId: paymentIntentId || null,
      transactionId: feeTransaction._id,
    });
    const feeDeadlineHoursRaw = typeof settings.arbitrationFeeDeadlineHours === 'number'
      ? settings.arbitrationFeeDeadlineHours
      : parseFloat(settings.arbitrationFeeDeadlineHours || '0');
    const fallbackDaysRaw = typeof settings.arbitrationFeeDeadlineDays === 'number'
      ? settings.arbitrationFeeDeadlineDays
      : parseFloat(settings.arbitrationFeeDeadlineDays || '1');
    const feeDeadlineHours = Number.isFinite(feeDeadlineHoursRaw) && feeDeadlineHoursRaw >= 0
      ? feeDeadlineHoursRaw
      : ((Number.isFinite(fallbackDaysRaw) ? fallbackDaysRaw : 1) * 24);
    if (!dispute.arbitrationFeeDeadline && dispute.arbitrationPayments.length === 1) {
      const feeDeadline = new Date();
      feeDeadline.setTime(feeDeadline.getTime() + feeDeadlineHours * 60 * 60 * 1000);
      dispute.arbitrationFeeDeadline = feeDeadline;
    }
    const paidUserIds = new Set((dispute.arbitrationPayments || []).map((p) => p.userId?.toString()));
    const bothPaid = paidUserIds.has(dispute.claimantId?.toString()) && paidUserIds.has(dispute.respondentId?.toString());
    if (bothPaid) {
      dispute.status = 'admin_arbitration';
      dispute.arbitrationRequested = true;
      dispute.arbitrationRequestedBy = req.user.id;
      dispute.arbitrationRequestedAt = new Date();
      dispute.arbitrationFeeDeadline = null;
    }
    await dispute.save();
    res.json({
      message: bothPaid
        ? 'Arbitration requested successfully. Admin will review the case.'
        : 'Arbitration fee paid. Waiting for the other party to pay.',
      dispute: mapJobDisputeResponse(dispute),
      newBalance: requestingUser.walletBalance,
    });
  } catch (err) {
    console.error('[Jobs] Request arbitration error:', err);
    res.status(500).json({ error: err.message || 'Failed to request arbitration' });
  }
});

router.post('/:id/disputes/:disputeId/admin-decide', authenticateToken, requireRole(['admin']), async (req, res) => {
  try {
    const { winnerId, decisionNotes } = req.body || {};
    if (!winnerId) return res.status(400).json({ error: 'Winner ID is required' });
    const dispute = await JobDispute.findById(req.params.disputeId);
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    if (dispute.status !== 'admin_arbitration') return res.status(400).json({ error: 'Dispute must be in admin arbitration phase' });
    if (winnerId !== dispute.claimantId?.toString() && winnerId !== dispute.respondentId?.toString()) {
      return res.status(400).json({ error: 'Winner must be either the claimant or respondent' });
    }
    const loserId = winnerId === dispute.claimantId?.toString() ? dispute.respondentId?.toString() : dispute.claimantId?.toString();
    const milestone = (job.milestones || []).find((m) => m._id.toString() === dispute.milestoneId?.toString());
    const milestoneAmount = Number(milestone?.amount || dispute.amount || 0);
    if (winnerId === dispute.claimantId?.toString()) {
      const claimant = await User.findById(winnerId).select('walletBalance');
      if (claimant && milestoneAmount > 0) {
        claimant.walletBalance = (claimant.walletBalance || 0) + milestoneAmount;
        await claimant.save();
        await Wallet.create({
          userId: claimant._id,
          type: 'deposit',
          amount: milestoneAmount,
          balance: claimant.walletBalance,
          status: 'completed',
          paymentMethod: 'wallet',
          jobId: job._id,
          milestoneId: dispute.milestoneId?.toString(),
          description: `Dispute resolution refund - ${job.title || 'Job'}`,
          metadata: { source: 'job_dispute_admin_refund', disputeId: dispute._id?.toString() },
        });
      }
    } else {
      const winner = await User.findById(winnerId).select('walletBalance');
      if (winner && milestoneAmount > 0) {
        winner.walletBalance = (winner.walletBalance || 0) + milestoneAmount;
        await winner.save();
        await Wallet.create({
          userId: winner._id,
          type: 'deposit',
          amount: milestoneAmount,
          balance: winner.walletBalance,
          status: 'completed',
          paymentMethod: 'wallet',
          jobId: job._id,
          milestoneId: dispute.milestoneId?.toString(),
          description: `Dispute resolution payout - ${job.title || 'Job'}`,
          metadata: { source: 'job_dispute_admin_payout', disputeId: dispute._id?.toString() },
        });
      }
    }
    dispute.status = 'closed';
    dispute.closedAt = new Date();
    dispute.winnerId = winnerId;
    dispute.loserId = loserId;
    dispute.adminDecision = true;
    dispute.decisionNotes = decisionNotes || '';
    await dispute.save();
    res.json({ message: 'Dispute decided successfully', dispute: mapJobDisputeResponse(dispute) });
  } catch (err) {
    console.error('[Jobs] Admin decide dispute error:', err);
    res.status(500).json({ error: err.message || 'Failed to decide dispute' });
  }
});

router.post('/:id/disputes/:disputeId/capture-paypal-arbitration', authenticateToken, async (req, res) => {
  try {
    const { paypalOrderId } = req.body || {};
    if (!paypalOrderId) return res.status(400).json({ error: 'PayPal order ID is required' });
    const dispute = await JobDispute.findById(req.params.disputeId);
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const pending = dispute.pendingPayPalArbitration;
    if (!pending || pending.paypalOrderId !== paypalOrderId) {
      return res.status(400).json({ error: 'No pending PayPal arbitration payment found for this dispute' });
    }
    if (pending.userId?.toString() !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to capture this payment' });
    }
    const settings = await PaymentSettings.getSettings();
    const environment = getPayPalClientForJobs(settings);
    const client = new paypal.core.PayPalHttpClient(environment);
    const captureRequest = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    captureRequest.requestBody({});
    const captureResponse = await client.execute(captureRequest);
    if (captureResponse.statusCode !== 201) {
      return res.status(400).json({ error: 'Failed to capture PayPal payment' });
    }
    dispute.arbitrationPayments = dispute.arbitrationPayments || [];
    dispute.arbitrationPayments.push({
      userId: req.user.id,
      amount: pending.amount,
      paidAt: new Date(),
      paymentMethod: 'paypal',
      paypalOrderId,
      transactionId: null,
    });
    dispute.arbitrationFeeAmount = pending.amount;
    dispute.pendingPayPalArbitration = undefined;
    const paidUserIds = new Set((dispute.arbitrationPayments || []).map((p) => p.userId?.toString()));
    const bothPaid = paidUserIds.has(dispute.claimantId?.toString()) && paidUserIds.has(dispute.respondentId?.toString());
    if (bothPaid) {
      dispute.status = 'admin_arbitration';
      dispute.arbitrationRequested = true;
      dispute.arbitrationRequestedBy = req.user.id;
      dispute.arbitrationRequestedAt = new Date();
      dispute.arbitrationFeeDeadline = null;
    }
    await dispute.save();
    res.json({
      message: bothPaid
        ? 'Arbitration requested successfully. Admin will review the case.'
        : 'Arbitration fee paid. Waiting for the other party to pay.',
      dispute: mapJobDisputeResponse(dispute),
    });
  } catch (err) {
    console.error('[Jobs] Capture PayPal arbitration error:', err);
    res.status(500).json({ error: err.message || 'Failed to capture PayPal payment' });
  }
});

router.delete('/:id/disputes/:disputeId', authenticateToken, async (req, res) => {
  try {
    const dispute = await JobDispute.findById(req.params.disputeId);
    if (!dispute) return res.status(404).json({ error: 'Dispute not found' });
    const job = await Job.findById(req.params.id);
    if (!job) return res.status(404).json({ error: 'Job not found' });
    const isClaimant = dispute.claimantId?.toString() === req.user.id;
    const isRespondent = dispute.respondentId?.toString() === req.user.id;
    if (!isClaimant && !isRespondent) return res.status(403).json({ error: 'Only parties involved in the dispute can cancel it' });
    if (!isClaimant) return res.status(403).json({ error: 'Only the dispute opener can cancel this dispute' });
    dispute.status = 'closed';
    dispute.closedAt = new Date();
    dispute.autoClosed = false;
    dispute.adminDecision = false;
    dispute.decisionNotes = `Dispute cancelled and withdrawn by claimant.`;
    await dispute.save();
    const milestone = (job.milestones || []).find((m) => m._id.toString() === dispute.milestoneId?.toString());
    if (milestone) {
      if (milestone.status === 'disputed') milestone.status = 'in-progress';
      milestone.disputeId = null;
      job.markModified('milestones');
      await job.save();
      emitJobUpdated(job);
    }
    res.json({ message: 'Dispute cancelled successfully', dispute: mapJobDisputeResponse(dispute), job: toJobResponse(job) });
  } catch (err) {
    console.error('[Jobs] Cancel dispute error:', err);
    res.status(500).json({ error: err.message || 'Failed to cancel dispute' });
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
