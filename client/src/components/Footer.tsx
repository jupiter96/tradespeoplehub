import { Facebook, Twitter, Instagram, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import imgAppStore from "figma:asset/36bc166354a0af18b92c1b4cc94416c79f3cdd6c.png";
import imgGooglePlay from "figma:asset/e7c88619f3afccee7ec2a322316aa19c8536ed04.png";
import logoImage from "figma:asset/1836a20ae1cb76610d3554b773af9c32ebaae548.png";
import imgPayment1 from "figma:asset/0e69cb7a2e02eae0ab4875af04918199153d3c99.png";

// Social Media Icon Components with Lucide Icons
function FacebookIcon() {
  return (
    <div className="cursor-pointer hover:opacity-70 transition-all duration-300 hover:scale-110">
      <Facebook className="w-8 h-8 text-white" />
    </div>
  );
}

function XIcon() {
  return (
    <div className="cursor-pointer hover:opacity-70 transition-all duration-300 hover:scale-110">
      <Twitter className="w-8 h-8 text-white" />
    </div>
  );
}

function InstagramIcon() {
  return (
    <div className="cursor-pointer hover:opacity-70 transition-all duration-300 hover:scale-110">
      <Instagram className="w-8 h-8 text-white" />
    </div>
  );
}

function PinterestIcon() {
  return (
    <div className="cursor-pointer hover:opacity-70 transition-all duration-300 hover:scale-110">
      <svg className="w-8 h-8 text-white fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
        <path d="M12.017 0C5.396 0 .029 5.367.029 11.987c0 5.079 3.158 9.417 7.618 11.162-.105-.949-.199-2.403.041-3.439.219-.937 1.406-5.957 1.406-5.957s-.359-.72-.359-1.781c0-1.663.967-2.911 2.168-2.911 1.024 0 1.518.769 1.518 1.688 0 1.029-.653 2.567-.992 3.992-.285 1.193.6 2.165 1.775 2.165 2.128 0 3.768-2.245 3.768-5.487 0-2.861-2.063-4.869-5.008-4.869-3.41 0-5.409 2.562-5.409 5.199 0 1.033.394 2.143.889 2.741.099.12.112.225.085.345-.09.375-.293 1.199-.334 1.363-.053.225-.172.271-.401.165-1.495-.69-2.433-2.878-2.433-4.646 0-3.776 2.748-7.252 7.92-7.252 4.158 0 7.392 2.967 7.392 6.923 0 4.135-2.607 7.462-6.233 7.462-1.214 0-2.354-.629-2.758-1.379l-.749 2.848c-.269 1.045-1.004 2.352-1.498 3.146 1.123.345 2.306.535 3.55.535 6.607 0 11.985-5.365 11.985-11.987C23.97 5.39 18.592.026 11.985.026L12.017 0z"/>
      </svg>
    </div>
  );
}

export default function Footer() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <footer className="w-full">
      {/* Main Footer Content */}
      <div className="bg-[#0f172b] py-6 md:py-12 px-6">
        <div className="max-w-7xl mx-auto">
          {/* Mobile Collapsed View */}
          <div className="md:hidden">
            <div className="flex items-center justify-between">
              {/* Logo and App Buttons */}
              <div className="flex items-center gap-4">
                <Link to="/">
                  <img 
                    src={logoImage} 
                    alt="Professional Services Platform" 
                    className="h-8 cursor-pointer"
                  />
                </Link>
                <div className="flex gap-2">
                  <a href="#" className="block">
                    <img 
                      src={imgAppStore} 
                      alt="Download on the App Store" 
                      className="h-8 w-auto object-contain rounded"
                    />
                  </a>
                  <a href="#" className="block">
                    <img 
                      src={imgGooglePlay} 
                      alt="Get it on Google Play" 
                      className="h-8 w-auto object-contain rounded"
                    />
                  </a>
                </div>
              </div>

              {/* Expand/Collapse Button */}
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-2 text-white hover:text-[#FE8A0F] transition-colors"
                aria-label={isExpanded ? "Collapse footer" : "Expand footer"}
              >
                {isExpanded ? (
                  <ChevronUp className="w-6 h-6" />
                ) : (
                  <ChevronDown className="w-6 h-6" />
                )}
              </button>
            </div>

            {/* Expanded Content - Mobile Two Columns */}
            {isExpanded && (
              <div className="mt-6 grid grid-cols-2 gap-6">
                {/* Left Column */}
                <div className="space-y-6">
                  {/* Clients */}
                  <div>
                    <h3 className="text-white text-[13px] mb-3 font-semibold">Clients</h3>
                    <ul className="text-gray-300 text-[12px] leading-[1.24] space-y-2">
                      <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">Post a task</a></li>
                      <li><Link to="/how-it-work" className="hover:text-[#FE8A0F] transition-colors">How it works</Link></li>
                      <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">Help centre</a></li>
                      <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">Cost guide</a></li>
                    </ul>
                  </div>

                  {/* Company */}
                  <div>
                    <h3 className="text-white text-[13px] mb-3 font-semibold">Company</h3>
                    <ul className="text-gray-300 text-[12px] leading-[1.24] space-y-2">
                      <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">About us</a></li>
                      <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">Contact us</a></li>
                      <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">Affiliate</a></li>
                      <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">Terms & Condition</a></li>
                      <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">Blog</a></li>
                    </ul>
                  </div>
                </div>

                {/* Right Column */}
                <div className="space-y-6">
                  {/* Professionals */}
                  <div>
                    <h3 className="text-white text-[13px] mb-3 font-semibold">Professionals</h3>
                    <ul className="text-gray-300 text-[12px] leading-[1.24] space-y-2">
                      <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">Sign up</a></li>
                      <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">How it works</a></li>
                      <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">Help centre</a></li>
                    </ul>
                  </div>

                  {/* Social Links */}
                  <div>
                    <h3 className="text-white text-[13px] mb-3 font-semibold">Social links</h3>
                    <div className="flex gap-2">
                      <div className="scale-75 origin-left"><FacebookIcon /></div>
                      <div className="scale-75 origin-left"><XIcon /></div>
                      <div className="scale-75 origin-left"><InstagramIcon /></div>
                      <div className="scale-75 origin-left"><PinterestIcon /></div>
                    </div>
                  </div>

                  {/* Payment Methods */}
                  <div>
                    <img 
                      src={imgPayment1} 
                      alt="Payment Methods" 
                      className="h-10"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Desktop View - Original Layout */}
          <div className="hidden md:grid grid-cols-2 lg:grid-cols-5 gap-8">
            {/* Logo and Description */}
            <div className="lg:col-span-1">
              <Link to="/">
                <img 
                  src={logoImage} 
                  alt="Professional Services Platform" 
                  className="h-10 mb-6 cursor-pointer"
                />
              </Link>
              <p className="text-gray-300 text-[14px] leading-[1.24]">
                Our platform connects clients to trusted professionals across all service sectors.
              </p>
              {/* Payment Methods */}
              <div className="mt-6">
                <img 
                  src={imgPayment1} 
                  alt="Payment Methods" 
                  className="h-12"
                />
              </div>
            </div>

            {/* Clients Column */}
            <div>
              <h3 className="text-white text-[14px] mb-6 font-semibold">Clients</h3>
              <ul className="text-gray-300 text-[14px] leading-[1.24] space-y-4">
                <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">Post a task</a></li>
                <li><Link to="/how-it-work" className="hover:text-[#FE8A0F] transition-colors">How it works</Link></li>
                <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">Help ventre</a></li>
                <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">Cost guide</a></li>
              </ul>
            </div>

            {/* Professionals Column */}
            <div>
              <h3 className="text-white text-[14px] mb-6 font-semibold">Professionals</h3>
              <ul className="text-gray-300 text-[14px] leading-[1.24] space-y-4">
                <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">Sign up</a></li>
                <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">How it works</a></li>
                <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">Help centre</a></li>
              </ul>
            </div>

            {/* Company Column */}
            <div>
              <h3 className="text-white text-[14px] mb-6 font-semibold">Company</h3>
              <ul className="text-gray-300 text-[14px] leading-[1.24] space-y-4">
                <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">About us</a></li>
                <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">Contact us</a></li>
                <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">Affiliate</a></li>
                <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">Terms & Condition</a></li>
                <li><a href="#" className="hover:text-[#FE8A0F] transition-colors">Blog</a></li>
              </ul>
            </div>

            {/* Social Links Column */}
            <div>
              <h3 className="text-white text-[14px] mb-6 font-semibold">Social links</h3>
              <div className="flex gap-3 mb-6">
                <FacebookIcon />
                <XIcon />
                <InstagramIcon />
                <PinterestIcon />
              </div>
              {/* App Download Buttons */}
              <div className="space-y-3">
                <a href="#" className="block">
                  <img 
                    src={imgAppStore} 
                    alt="Download on the App Store" 
                    className="h-12 w-40 object-cover rounded-lg"
                  />
                </a>
                <a href="#" className="block">
                  <img 
                    src={imgGooglePlay} 
                    alt="Get it on Google Play" 
                    className="h-12 w-40 object-cover rounded-lg"
                  />
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Divider Line - Full Width */}
      <div className="bg-[#0f172b]">
        <div className="border-t border-gray-600"></div>
      </div>

      {/* Bottom Band */}
      <div className="bg-[#0f172b] py-6 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-center">
            <p className="text-[silver] text-[14px] leading-[1.24]">
              <span className="font-['Roboto:Bold',sans-serif]">©</span>
              {` 2025 Trades Peoplehub. All Right Reserved.`}
            </p>
            <div className="flex items-center gap-6">
              <a href="#" className="text-[#fdfdfd] text-[14px] leading-[1.24] hover:text-[#FE8A0F] transition-colors">Cookie Policy</a>
              <a href="#" className="text-[#fdfdfd] text-[14px] leading-[1.24] hover:text-[#FE8A0F] transition-colors">Privacy policy</a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}