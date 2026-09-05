import React, { useState, useEffect, useRef, useMemo } from 'react';
import { io } from 'socket.io-client';
import Navbar from './components/Navbar';
import LandingPage from './components/LandingPage';
import AuthModal from './components/AuthModal';
import AdminDashboard from './components/AdminDashboard';
import StatusPipeline from './components/StatusPipeline';
import AIRepairCopilotDrawer from './components/AIRepairCopilotDrawer';
import AIVisionAssessmentModal from './components/AIVisionAssessmentModal';
import EnvironmentalImpactCard from './components/EnvironmentalImpactCard';
import QRCodeModal from './components/QRCodeModal';
import SignalBackground from './components/SignalBackground';
import InteractiveMap from './components/InteractiveMap';
import BookingCalendarModal from './components/BookingCalendarModal';
import MultiQuoteBiddingModal from './components/MultiQuoteBiddingModal';
import LiveChatModal from './components/LiveChatModal';
import QRScannerModal from './components/QRScannerModal';
import ReviewModal from './components/ReviewModal';
import RepairerWorkspace from './components/RepairerWorkspace';
import GlobalSearchModal from './components/GlobalSearchModal';
import CreateEventModal from './components/CreateEventModal';
import CommunityDIYFeed from './components/CommunityDIYFeed';
import ProfileModal from './components/ProfileModal';
import BookingManagementPanel from './components/BookingManagementPanel';
import ItemHistoryModal from './components/ItemHistoryModal';
import {
  Plus,
  Wrench,
  MapPin,
  Sparkles,
  QrCode,
  Calendar,
  Search,
  Star,
  ShieldCheck,
  CheckCircle2,
  Lock,
  Cpu,
  MessageSquare,
  DollarSign,
  Camera,
  Clock,
  Check,
  Users,
  AlertTriangle,
  BookOpen,
  History,
  UploadCloud,
  Trash2,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';

const CATEGORY_HIERARCHY = {
  'Electronics': {
    subCategories: ['Smartphones', 'Laptops & Computers', 'Television & Displays', 'Audio & Headphones', 'Gaming Consoles', 'Tablets', 'Other'],
    diagnosticPrompts: ['Does not turn on', 'Screen cracked / dead pixels', 'Battery drains quickly', 'Thermal overheating', 'Burning electrical odor', 'Port loose / not charging'],
  },
  'Home Appliances': {
    subCategories: ['Microwave Ovens', 'Refrigerators', 'Blenders & Mixers', 'Washing Machines', 'Air Conditioners', 'Water Purifiers', 'Other'],
    diagnosticPrompts: ['Sparks / arcing sound', 'Motor humming but not spinning', 'Does not heat up', 'Water leaking', 'Trips circuit breaker', 'Excessive vibration'],
  },
  'Furniture': {
    subCategories: ['Wooden Chairs & Tables', 'Sofas & Upholstery', 'Cabinets & Wardrobes', 'Bed Frames', 'Hardware & Hinges', 'Other'],
    diagnosticPrompts: ['Broken leg / joint', 'Loose screw threading', 'Upholstery tear', 'Drawer tracks jammed', 'Surface refinishing needed'],
  },
  'Textiles & Clothing': {
    subCategories: ['Leather Jackets & Bags', 'Denim & Pants', 'Zippers & Buttons', 'Tailoring & Alterations', 'Footwear & Boots', 'Other'],
    diagnosticPrompts: ['Broken zipper slider', 'Seam unraveling', 'Tear in fabric', 'Sole detaching', 'Lining replacement needed'],
  },
  'Bicycles': {
    subCategories: ['Mountain & Road Bikes', 'Commuter & Single Speed', 'Chain & Drivetrain', 'Brakes & Cables', 'Wheel & Tire Alignment', 'Other'],
    diagnosticPrompts: ['Chain skipping gears', 'Brake pads worn / rubbing', 'Punctured tube', 'Wheel rim untrue', 'Bottom bracket creaking'],
  },
  'Mechanical': {
    subCategories: ['Power Tools & Drills', 'Lawn Mowers', 'Generators', 'Pumps & Compressors', 'Hardware & Fasteners', 'Other'],
    diagnosticPrompts: ['Motor smoking', 'Trigger switch unresponsive', 'Loss of pressure/power', 'Pull cord snapped', 'Gearbox grinding'],
  },
  'Other': {
    subCategories: ['General / Miscellaneous', 'Toys & Collectibles', 'Sports Equipment', 'Musical Instruments', 'Watches & Clocks', 'Other'],
    diagnosticPrompts: ['Physical damage / crack', 'Mechanical failure / stuck parts', 'Loose attachment / missing component', 'Cosmetic defect / wear', 'Other unlisted issue'],
  },
};


class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error('[RepairHub UI Error Boundary]:', error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '40px 24px', textAlign: 'center', background: '#FDFBF9', minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#2D1B11' }}>
          <div style={{ background: '#FFFFFF', border: '1px solid #EAE0D6', borderRadius: 4, padding: '32px 24px', maxWidth: 460, boxShadow: '0 4px 20px rgba(45,27,17,0.06)' }}>
            <div style={{ width: 44, height: 44, borderRadius: '50%', background: '#F5EBE6', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: '#CB4D22' }}>
              <Wrench size={22} />
            </div>
            <h2 style={{ fontSize: 18, fontWeight: 700, marginBottom: 8, color: '#2D1B11' }}>View temporarily unavailable</h2>
            <p style={{ fontSize: 13, color: '#7A6458', marginBottom: 20, lineHeight: 1.5 }}>
              A temporary display error occurred while rendering this section. Please reload or switch to another tab.
            </p>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
              <button
                onClick={() => {
                  this.setState({ hasError: false, error: null });
                  if (this.props.onReset) this.props.onReset();
                }}
                className="btn-secondary"
                style={{ padding: '8px 16px', fontSize: 12.5 }}
              >
                Return to Home
              </button>
              <button
                onClick={() => window.location.reload()}
                className="btn-primary"
                style={{ padding: '8px 16px', fontSize: 12.5 }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = sessionStorage.getItem('repairhub_user') || localStorage.getItem('repairhub_user');
    return saved ? JSON.parse(saved) : null;
  });

  const [activeTab, setActiveTab] = useState(() => {
    const saved = sessionStorage.getItem('repairhub_user') || localStorage.getItem('repairhub_user');
    if (saved) {
      const u = JSON.parse(saved);
      if (u.role === 'Repairer') return 'workspace';
      if (u.role === 'Admin') return 'admin';
      return 'dashboard';
    }
    return 'home';
  });

  const [statusFilter, setStatusFilter] = useState('All');
  const [isCopilotOpen, setIsCopilotOpen] = useState(false);
  const [isVisionOpen, setIsVisionOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState(null);

  // Modals State
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [selectedBookingRepairer, setSelectedBookingRepairer] = useState(null);
  const [isQuotesOpen, setIsQuotesOpen] = useState(false);
  const [selectedQuoteTicket, setSelectedQuoteTicket] = useState(null);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [selectedChatTicket, setSelectedChatTicket] = useState(null);
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [selectedReviewTicket, setSelectedReviewTicket] = useState(null);
  const [reviewedTicketIds, setReviewedTicketIds] = useState(() => {
    try {
      const saved = localStorage.getItem('repairhub_reviewed_tickets');
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      return [];
    }
  });
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [promotedToast, setPromotedToast] = useState(null);
  const [scanStatusUpdate, setScanStatusUpdate] = useState(null);
  const [newConfirmedBooking, setNewConfirmedBooking] = useState(null);

  // Real-time Chat Notifications State
  const [unreadChats, setUnreadChats] = useState({});
  const [chatToast, setChatToast] = useState(null);
  const globalSocketRef = useRef(null);
  const isChatOpenRef = useRef(isChatOpen);
  const selectedChatTicketRef = useRef(selectedChatTicket);
  const currentUserRef = useRef(currentUser);
  const requestsRef = useRef([]);
  const processedMessageIdsRef = useRef(new Set());

  useEffect(() => {
    isChatOpenRef.current = isChatOpen;
  }, [isChatOpen]);

  useEffect(() => {
    selectedChatTicketRef.current = selectedChatTicket;
  }, [selectedChatTicket]);

  useEffect(() => {
    currentUserRef.current = currentUser;
  }, [currentUser]);

  const playNotificationChime = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const audioCtx = new AudioContext();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, audioCtx.currentTime); // D5
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15); // A5
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.3);
    } catch (e) {}
  };

  const handleOpenChatForTicket = (ticket) => {
    if (!ticket) return;
    setSelectedChatTicket(ticket);
    setIsChatOpen(true);
    if (ticket.ticketNumber || ticket._id) {
      setUnreadChats((prev) => {
        const next = { ...prev };
        if (ticket.ticketNumber) delete next[ticket.ticketNumber];
        if (ticket._id) delete next[ticket._id];
        return next;
      });
    }
  };

  // Global Keyboard Shortcuts (Ctrl+K / Cmd+K to Search, ESC to dismiss modals)
  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && (e.key === 'k' || e.key === 'K')) {
        e.preventDefault();
        setIsSearchOpen((prev) => !prev);
      } else if (e.key === 'Escape') {
        setIsSearchOpen(false);
        setIsAuthOpen(false);
        setIsCopilotOpen(false);
        setIsVisionOpen(false);
        setIsBookingOpen(false);
        setIsQuotesOpen(false);
        setIsChatOpen(false);
        setIsScannerOpen(false);
        setIsReviewOpen(false);
        setIsCreateEventOpen(false);
        setIsProfileOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Repair Request Form & Wizard State (Module 1 - FR-01, FR-02)
  const [formData, setFormData] = useState({
    itemTitle: '',
    itemDescription: '',
    category: 'Home Appliances',
    subCategory: 'Microwave Ovens',
    issueDescription: '',
    preferredMethod: 'drop-off',
    address: 'Merul Badda, Dhaka',
    photos: [],
    photoData: null,
    estimatedCost: null,
    severityScore: null,
  });
  const [wizardStep, setWizardStep] = useState(1);
  const [formSubmitted, setFormSubmitted] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [selectedHistoryTicket, setSelectedHistoryTicket] = useState(null);

  const handlePhotoUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setFormData((prev) => ({
            ...prev,
            photos: [...(prev.photos || []), event.target.result],
          }));
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const handleRemovePhoto = (index) => {
    setFormData((prev) => ({
      ...prev,
      photos: (prev.photos || []).filter((_, i) => i !== index),
    }));
  };

  const handleCategoryChange = (newCategory) => {
    const subCats = CATEGORY_HIERARCHY[newCategory]?.subCategories || ['General'];
    setFormData((prev) => ({
      ...prev,
      category: newCategory,
      subCategory: subCats[0] || 'General',
    }));
  };

  const handleAppendDiagnosticPrompt = (prompt) => {
    setFormData((prev) => ({
      ...prev,
      issueDescription: prev.issueDescription
        ? `${prev.issueDescription.trim()}. ${prompt}`
        : prompt,
    }));
  };

  // Active Repairs (Database-backed)
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    requestsRef.current = requests;
  }, [requests]);

  // Compute total unread chats count for Navbar indicator
  const totalUnreadCount = useMemo(() => {
    if (!unreadChats) return 0;
    const unreadKeys = Object.keys(unreadChats).filter(k => unreadChats[k] > 0);
    if (unreadKeys.length === 0) return 0;
    const matchedTickets = new Set();
    unreadKeys.forEach(k => {
      const match = (requests || []).find(r => r.ticketNumber === k || r._id === k);
      if (match) {
        matchedTickets.add(match._id || match.ticketNumber);
      } else {
        matchedTickets.add(k);
      }
    });
    return matchedTickets.size;
  }, [unreadChats, requests]);

  // Fetch authenticated user's repair requests from MongoDB
  const fetchUserRepairs = React.useCallback(async () => {
    const token = currentUser?.token || sessionStorage.getItem('repairhub_token') || localStorage.getItem('repairhub_token');
    const userRole = currentUser?.role;

    if (!currentUser) {
      setRequests([]);
      return;
    }

    try {
      const isCustomer = ['Requester', 'Customer', 'requester'].includes(userRole);
      const isRepairer = ['Repairer', 'repairer'].includes(userRole);

      let url = '/api/repairs';
      if (isCustomer) {
        const reqIdParam = currentUser._id || 'me';
        url = `/api/repairs?requesterId=${encodeURIComponent(reqIdParam)}`;
      } else if (isRepairer) {
        url = '/api/repairs';
      }

      const res = await fetch(url, {
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      const data = await res.json();

      if (data.success && Array.isArray(data.data)) {
        const mapped = data.data.map((item) => {
          let paymentStatus = 'AWAITING_BIDS';
          if (item.status === 'Completed') {
            paymentStatus = 'RELEASED_TO_TECH';
          } else if (['In Progress', 'Ready for Pickup'].includes(item.status)) {
            paymentStatus = 'HELD_IN_VAULT';
          }

          const bidsCount = Array.isArray(item.bids) ? item.bids.length : 0;
          let assignedName = item.assignedRepairerId?.businessName || item.assignedRepairerId?.name;
          if (!assignedName) {
            if (['Requested', 'Quoted'].includes(item.status)) {
              assignedName = bidsCount > 0 ? `Awaiting Bids (${bidsCount})` : 'Awaiting Bids (0)';
            } else {
              assignedName = 'Assigned Technician';
            }
          }

          return {
            _id: item._id,
            ticketNumber: item.ticketNumber,
            itemTitle: item.itemTitle,
            itemDescription: item.itemDescription,
            category: item.category,
            subCategory: item.subCategory,
            issueDescription: item.issueDescription,
            status: item.status,
            assignedRepairer: assignedName,
            assignedRepairerId: item.assignedRepairerId?._id || item.assignedRepairerId,
            repairerRating: (item.assignedRepairerId?.ratingCount > 0 && item.assignedRepairerId?.rating != null) ? Number(item.assignedRepairerId.rating) : 0,
            repairerRatingCount: item.assignedRepairerId?.ratingCount || 0,
            quotedPrice: item.finalPrice || item.estimatedPrice || (item.bids?.length > 0 ? item.bids[0].price : null),
            paymentStatus,
            date: item.createdAt ? new Date(item.createdAt).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' }) : 'Recent',
            hasReviewed: !!item.hasReviewed,
            review: item.review || null,
            bids: item.bids || [],
            requesterId: item.requesterId?._id || item.requesterId,
            customerName: item.requesterId?.name || currentUser?.name || 'Customer',
            customerAddress: item.location?.address || item.requesterId?.address || currentUser?.address || 'Dhaka',
          };
        });
        setRequests(mapped);

        const fromBackend = data.data.filter((it) => it.hasReviewed).map((it) => it._id);
        if (fromBackend.length > 0) {
          setReviewedTicketIds((prev) => Array.from(new Set([...prev, ...fromBackend])));
        }
      } else {
        setRequests([]);
      }
    } catch (err) {
      console.warn('[Fetch Repairs Notice]:', err.message);
      setRequests([]);
    }
  }, [currentUser]);

  // Synchronize repair requests whenever active user changes
  useEffect(() => {
    fetchUserRepairs();
  }, [fetchUserRepairs]);

  // Connect socket.io for real-time order chat messages & notifications
  useEffect(() => {
    const socketEndpoint = window.location.port === '5173' ? 'http://localhost:5000' : window.location.origin;
    const socket = io(socketEndpoint, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 20,
      timeout: 10000,
    });
    globalSocketRef.current = socket;

    const joinAllCurrentRooms = () => {
      const curReqs = requestsRef.current;
      if (curReqs && Array.isArray(curReqs)) {
        curReqs.forEach((r) => {
          if (r.ticketNumber) socket.emit('join_room', `order_${r.ticketNumber}`);
          if (r._id) socket.emit('join_room', `order_${r._id}`);
        });
      }
    };

    socket.on('connect', () => {
      joinAllCurrentRooms();
    });

    socket.on('receive_message', (msg) => {
      if (!msg) return;

      // Deduplicate to prevent double-counting if delivered via multiple room subscriptions
      if (msg.id) {
        if (processedMessageIdsRef.current.has(msg.id)) return;
        processedMessageIdsRef.current.add(msg.id);
        if (processedMessageIdsRef.current.size > 200) {
          const first = processedMessageIdsRef.current.values().next().value;
          processedMessageIdsRef.current.delete(first);
        }
      }

      const user = currentUserRef.current;
      const isFromMe =
        (user?._id && String(msg.senderId) === String(user._id)) ||
        (user?.name && msg.senderName === user.name) ||
        (user?.businessName && msg.senderName === user.businessName);
      if (isFromMe) return;

      const ticketNum = msg.ticketNumber || (typeof msg.repairRequestId === 'string' ? msg.repairRequestId : msg.repairRequestId?.ticketNumber);
      const reqId = typeof msg.repairRequestId === 'string' ? msg.repairRequestId : (msg.repairRequestId?._id || msg.repairRequestId);
      if (!ticketNum && !reqId) return;

      const currentTicket = selectedChatTicketRef.current;
      const open = isChatOpenRef.current;
      if (open && currentTicket && (
        (ticketNum && currentTicket.ticketNumber === ticketNum) ||
        (reqId && currentTicket._id === reqId) ||
        (ticketNum && currentTicket._id === ticketNum)
      )) {
        return; // User is already in this chat modal
      }

      setUnreadChats((prev) => {
        const next = { ...prev };
        if (ticketNum) next[ticketNum] = (next[ticketNum] || 0) + 1;
        if (reqId && reqId !== ticketNum) next[reqId] = (next[reqId] || 0) + 1;
        return next;
      });

      playNotificationChime();

      setChatToast({
        ticketNumber: ticketNum || 'Order',
        repairRequestId: reqId,
        senderName: msg.senderName || 'Technician',
        text: msg.text || msg.content || 'Sent a new message',
      });
      setTimeout(() => setChatToast(null), 7000);
    });

    return () => {
      socket.disconnect();
    };
  }, [currentUser?._id]);

  // Join rooms for all user's tickets whenever requests change so notifications fire reliably
  useEffect(() => {
    requestsRef.current = requests;
    if (globalSocketRef.current && requests && requests.length > 0) {
      requests.forEach((r) => {
        if (r.ticketNumber) globalSocketRef.current.emit('join_room', `order_${r.ticketNumber}`);
        if (r._id) globalSocketRef.current.emit('join_room', `order_${r._id}`);
      });
    }
  }, [requests]);

  // Verified Repairers Directory
  const [repairers, setRepairers] = useState([]);

  const fetchRepairers = () => {
    fetch('/api/bookings/repairers')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const mapped = data.data.map((u) => {
            const latLng = (u.location?.coordinates && u.location.coordinates.length === 2)
              ? [u.location.coordinates[1], u.location.coordinates[0]]
              : [23.7808, 90.4174];
            return {
              _id: u._id,
              name: u.name,
              businessName: u.businessName || u.name,
              categories: u.categories?.length > 0 ? u.categories : ['Electronics', 'Home Appliances'],
              technicianType: u.technicianType || 'workshop',
              rating: (u.ratingCount > 0 && u.rating != null) ? Number(u.rating) : 0,
              reviewsCount: u.ratingCount || 0,
              address: u.address || 'Dhaka',
              startingRate: u.priceRangeMin || 300,
              isVerified: u.isVerified !== false,
              latLng,
            };
          });
          setRepairers(mapped);
        }
      })
      .catch((err) => console.warn('[Repairers Load Notice]:', err.message));
  };

  const fetchEvents = () => {
    fetch('/api/events')
      .then((res) => res.json())
      .then((data) => {
        if (data.success && Array.isArray(data.data) && data.data.length > 0) {
          const mapped = data.data.map((ev) => {
            const rawCoords = ev.location?.coordinates;
            const latLng = (Array.isArray(rawCoords) && rawCoords.length === 2)
              ? [rawCoords[1], rawCoords[0]]
              : [23.7712, 90.4255];
            const eventDate = new Date(ev.date).toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
            return {
              _id: ev._id,
              title: ev.title,
              date: eventDate,
              time: `${ev.startTime || '10:00 AM'} – ${ev.endTime || '04:00 PM'}`,
              venue: ev.location?.venueName || ev.location?.address || 'Community Venue, Dhaka',
              latLng,
              capacity: ev.capacity || 30,
              currentRsvps: ev.rsvps?.length || 0,
              categories: ev.categoriesHandled || ['Electronics', 'Home Appliances'],
              userStatus: ev.rsvps?.some(r => r.userId === currentUser?._id || r.userId?._id === currentUser?._id) ? 'Attending' : null,
              waitlist: ev.waitlist || [],
            };
          });
          setEvents(mapped);
        }
      })
      .catch((err) => console.warn('[Events Load Notice]:', err.message));
  };

  // Sync verified repairers & events from database
  useEffect(() => {
    fetchRepairers();
    fetchEvents();
  }, [currentUser?._id]);

  // Community Events
  const [events, setEvents] = useState([]);

  const handleAuthSuccess = (user) => {
    setRequests([]);
    setNewConfirmedBooking(null);

    const formattedUser = {
      ...user,
      role: user.role === 'repairer' ? 'Repairer' : user.role === 'requester' ? 'Requester' : user.role,
    };
    setCurrentUser(formattedUser);

    // If a new workshop was registered, add it to the interactive map
    if (formattedUser.role === 'Repairer' && user.businessName) {
      const exists = repairers.some((r) => r._id === user._id || r.businessName === user.businessName);
      if (!exists) {
        const newWorkshop = {
          _id: user._id || `rep_${Date.now()}`,
          name: user.name,
          businessName: user.businessName,
          categories: user.categories?.length > 0 ? user.categories : ['Electronics'],
          rating: 0,
          reviewsCount: 0,
          address: user.address || 'Merul Badda, Dhaka',
          latLng: user.latLng || (user.location?.coordinates ? [user.location.coordinates[1], user.location.coordinates[0]] : [23.7712, 90.4255]),
          distance: '0.4 km',
          startingRate: user.startingRate || 300,
          isVerified: true,
        };
        setRepairers((prev) => [newWorkshop, ...prev]);
        setPromotedToast(`Workshop "${newWorkshop.businessName}" pinned to interactive map!`);
        setTimeout(() => setPromotedToast(null), 3500);
      }
    }

    if (formattedUser.role === 'Admin') {
      setActiveTab('admin');
    } else if (formattedUser.role === 'Repairer') {
      setActiveTab('workspace');
    } else {
      setActiveTab('dashboard');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('repairhub_user');
    localStorage.removeItem('repairhub_token');
    sessionStorage.removeItem('repairhub_user');
    sessionStorage.removeItem('repairhub_token');
    setCurrentUser(null);
    setRequests([]);
    setNewConfirmedBooking(null);
    setActiveTab('home');
  };

  const handleCreateRequest = async (e) => {
    e.preventDefault();
    if (!currentUser) {
      setIsAuthOpen(true);
      return;
    }

    const token = currentUser?.token || sessionStorage.getItem('repairhub_token') || localStorage.getItem('repairhub_token');

    if (token) {
      try {
        const response = await fetch('/api/repairs', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            itemTitle: formData.itemTitle,
            itemDescription: formData.itemDescription || formData.itemTitle,
            category: formData.category,
            subCategory: formData.subCategory || 'General',
            issueDescription: formData.issueDescription,
            preferredMethod: formData.preferredMethod,
            photos: [
              ...(formData.photoData ? [formData.photoData] : []),
              ...(formData.photos || []),
            ],
            location: {
              type: 'Point',
              coordinates: currentUser?.latLng ? [currentUser.latLng[1], currentUser.latLng[0]] : [90.4125, 23.8103],
              address: formData.address || currentUser?.address || 'Dhaka',
            },
          }),
        });

        if (response.ok) {
          const resData = await response.json();
          await fetchUserRepairs();
          setFormSubmitted(true);
          setTimeout(() => {
            setFormSubmitted(false);
            setActiveTab('dashboard');
          }, 1200);
          return;
        }
      } catch (err) {
        console.warn('[Create Request Fallback]:', err.message);
      }
    }

    // Demo fallback local request
    const newReq = {
      _id: `req_${Date.now()}`,
      ticketNumber: `RH-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      itemTitle: formData.itemTitle,
      itemDescription: formData.itemDescription || formData.itemTitle,
      category: formData.category,
      issueDescription: formData.issueDescription,
      photoData: formData.photoData || null,
      estimatedCost: formData.estimatedCost || null,
      severityScore: formData.severityScore || null,
      status: 'Requested',
      assignedRepairer: 'Awaiting Bids (0)',
      bids: [],
      customerName: currentUser?.name || 'Customer',
      customerAddress: currentUser?.address || 'Merul Badda, Dhaka',
      customerLatLng: currentUser?.latLng || [23.7712, 90.4255],
      repairerRating: null,
      quotedPrice: null,
      paymentStatus: 'AWAITING_BIDS',
      date: 'Just now',
    };
    setRequests((current) => [newReq, ...current]);
    setFormSubmitted(true);
    setTimeout(() => {
      setFormSubmitted(false);
      setActiveTab('dashboard');
    }, 1200);
  };

  const handleAcceptQuote = (ticketId, quote) => {
    setRequests((current) =>
      current.map((r) =>
        r._id === ticketId || r.ticketNumber === ticketId
          ? {
              ...r,
              status: 'In Progress',
              assignedRepairer: quote.businessName || quote.repairerName || 'Assigned Technician',
              assignedRepairerId: quote.repairerId?._id || quote.repairerId,
              quotedPrice: quote.totalPrice || quote.price,
              paymentStatus: 'HELD_IN_VAULT',
            }
          : r
      )
    );
    // Sync freshly updated assignment & vault status from database
    setTimeout(() => {
      fetchUserRepairs();
    }, 400);
  };

  const handleStatusUpdated = (requestId, newStatus) => {
    setRequests((current) =>
      current.map((r) =>
        r._id === requestId || r.ticketNumber === requestId
          ? { ...r, status: newStatus }
          : r
      )
    );
    if (newStatus === 'Completed') {
      window.dispatchEvent(new CustomEvent('repairhub:repair_status_updated'));
    }
    setTimeout(() => {
      fetchUserRepairs();
    }, 400);
  };


  const handleQuoteSubmitted = (quote) => {
    setRequests((current) =>
      current.map((r) => {
        if (r._id === quote.repairRequestId || r.ticketNumber === quote.ticketNumber) {
          const updatedBids = [...(r.bids || []), quote];
          return {
            ...r,
            status: 'Quoted',
            bids: updatedBids,
            assignedRepairer: `Awaiting Bids (${updatedBids.length})`,
          };
        }
        return r;
      })
    );
    setPromotedToast(`Technician quote for ৳${quote.totalPrice || quote.price} registered.`);
    setTimeout(() => setPromotedToast(null), 3500);
    setTimeout(() => {
      fetchUserRepairs();
    }, 500);
  };

  const handleScanSuccess = async (scanData) => {
    const nextStatus = scanData.action === 'drop-off' ? 'In Progress' : 'Completed';
    const scanTypeBackend = scanData.action === 'drop-off' ? 'dropoff' : 'pickup';
    const token = currentUser?.token || sessionStorage.getItem('repairhub_token') || localStorage.getItem('repairhub_token');
    const isRealAuth = token && !token.startsWith('demo_');

    const matchingReq = requests.find((r) => r.ticketNumber === scanData.ticketNumber);
    const targetTicket = matchingReq || selectedTicket;

    if (isRealAuth && targetTicket?._id && targetTicket._id.length === 24 && !targetTicket._id.startsWith('req_') && !targetTicket._id.startsWith('t_')) {
      try {
        await fetch(`/api/repairs/${targetTicket._id}/verify-qr`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            ticketNumber: scanData.ticketNumber,
            scanType: scanTypeBackend,
          }),
        });
      } catch (err) {
        console.warn('[QR Verification Notice]:', err.message);
      }
    }

    setRequests((current) =>
      current.map((r) => {
        if (r.ticketNumber === scanData.ticketNumber) {
          return {
            ...r,
            status: nextStatus,
            paymentStatus: nextStatus === 'Completed' ? 'RELEASED_TO_TECH' : r.paymentStatus,
          };
        }
        return r;
      })
    );

    setScanStatusUpdate({
      ticketNumber: scanData.ticketNumber,
      ticketId: matchingReq?._id || selectedTicket?._id,
      status: nextStatus,
    });

    if (nextStatus === 'Completed') {
      setStatusFilter('Completed');
      window.dispatchEvent(new CustomEvent('repairhub:repair_status_updated'));
    }
  };


  const handleReviewSubmitted = (reviewData) => {
    console.log('[Review Submitted]:', reviewData);
    const reqId = reviewData.repairRequestId || reviewData.ticketId;
    if (reqId) {
      setReviewedTicketIds((prev) => {
        const next = Array.from(new Set([...prev, reqId]));
        try {
          localStorage.setItem('repairhub_reviewed_tickets', JSON.stringify(next));
        } catch (e) {}
        return next;
      });
      setRequests((prev) =>
        prev.map((r) => (r._id === reqId || r.ticketNumber === reqId ? { ...r, hasReviewed: true } : r))
      );
    }
    setPromotedToast('Verified rating and technician review published successfully!');
    setTimeout(() => setPromotedToast(null), 3500);
    setTimeout(() => {
      fetchUserRepairs();
      fetchRepairers();
    }, 600);
  };

  const handleRSVPToggle = async (eventId) => {
    const token = currentUser?.token || sessionStorage.getItem('repairhub_token') || localStorage.getItem('repairhub_token');
    const isRealAuth = token && !token.startsWith('demo_');
    const targetEv = events.find((ev) => ev._id === eventId);
    const isAttending = targetEv?.userStatus === 'Attending';

    if (isRealAuth && eventId && eventId.length === 24 && !eventId.startsWith('ev_')) {
      try {
        if (isAttending) {
          await fetch(`/api/events/${eventId}/rsvp`, {
            method: 'DELETE',
            headers: { Authorization: `Bearer ${token}` }
          });
        } else {
          await fetch(`/api/events/${eventId}/rsvp`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${token}` }
          });
        }
      } catch (err) {
        console.warn('[Event RSVP Notice]:', err.message);
      }
    }

    setEvents(
      events.map((ev) => {
        if (ev._id === eventId) {
          const attendingNow = ev.userStatus === 'Attending';
          const waitlistedNow = ev.userStatus && ev.userStatus.includes('Waitlisted');

          if (attendingNow) {
            const updatedRsvps = Math.max(0, ev.currentRsvps - 1);
            setPromotedToast('Cancelled RSVP. Slot released to waitlist queue.');
            setTimeout(() => setPromotedToast(null), 3000);
            return {
              ...ev,
              userStatus: 'Not Attending',
              currentRsvps: updatedRsvps,
            };
          } else if (waitlistedNow) {
            return {
              ...ev,
              userStatus: 'Not Attending',
            };
          } else {
            if (ev.currentRsvps >= ev.capacity) {
              setPromotedToast(`Capacity full (${ev.capacity}/${ev.capacity}). Added to FIFO waitlist queue (#1)!`);
              setTimeout(() => setPromotedToast(null), 3000);
              return {
                ...ev,
                userStatus: 'Waitlisted (#1 in queue)',
              };
            } else {
              setPromotedToast(`RSVP Confirmed for ${ev.title}!`);
              setTimeout(() => setPromotedToast(null), 3000);
              return {
                ...ev,
                userStatus: 'Attending',
                currentRsvps: ev.currentRsvps + 1,
              };
            }
          }
        }
        return ev;
      })
    );
  };

  const handleCreateEvent = (newEvent) => {
    setEvents([newEvent, ...events]);
    setPromotedToast(`Published new event: "${newEvent.title}"`);
    setTimeout(() => setPromotedToast(null), 3000);
  };

  const handleSelectSearchResult = (type, data) => {
    if (type === 'repairer') {
      setSelectedBookingRepairer(data);
      setIsBookingOpen(true);
    } else if (type === 'request') {
      setActiveTab('dashboard');
    } else if (type === 'event') {
      setActiveTab('events');
    }
  };

  const filteredRequests = statusFilter === 'All'
    ? requests
    : requests.filter((r) => r.status === statusFilter);

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', color: 'var(--text)', fontFamily: 'Inter, sans-serif', display: 'flex', flexDirection: 'column' }}>
      <SignalBackground />

      {/* Toast */}
      {promotedToast && (
        <div style={{ position: 'fixed', top: 72, right: 20, zIndex: 60, background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 10, padding: '10px 16px', boxShadow: '0 4px 20px rgba(0,0,0,0.1)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, fontWeight: 500, color: 'var(--text)' }}>
          <CheckCircle2 size={16} style={{ color: 'var(--brand)', flexShrink: 0 }} />
          {promotedToast}
        </div>
      )}

      <div style={{ position: 'relative', zIndex: 10, display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

        {/* Navigation Bar */}
        <Navbar
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          onOpenCopilot={() => setIsCopilotOpen(true)}
          onOpenVision={() => setIsVisionOpen(true)}
          setIsAiOpen={setIsCopilotOpen}
          setIsSearchOpen={setIsSearchOpen}
          currentUser={currentUser}
          onOpenAuth={() => setIsAuthOpen(true)}
          onLogout={handleLogout}
          onOpenProfile={() => setIsProfileOpen(true)}
          onOpenScanner={() => setIsScannerOpen(true)}
          unreadCount={totalUnreadCount}
          onOpenRecentChat={() => {
            const unreadReq = (requests || []).find(r => unreadChats && (unreadChats[r.ticketNumber] || unreadChats[r._id]));
            if (unreadReq) {
              handleOpenChatForTicket(unreadReq);
            } else {
              setActiveTab(currentUser?.role === 'Repairer' || currentUser?.role === 'repairer' ? 'workspace' : 'dashboard');
            }
          }}
        />

        {/* Main Content Viewport */}
        <ErrorBoundary onReset={() => setActiveTab('home')}>
          <main style={{ flex: 1, maxWidth: 1240, width: '100%', margin: '0 auto', padding: '24px 24px 48px', boxSizing: 'border-box' }}>

          {/* VIEW 1: MASTER LANDING HERO */}
          {activeTab === 'home' && (
            <LandingPage
              onOpenAuth={() => setIsAuthOpen(true)}
              onExplore={() => setActiveTab('explore')}
              onRequestRepair={() => setActiveTab('request')}
              onOpenCopilot={() => setIsCopilotOpen(true)}
              onOpenVision={() => setIsVisionOpen(true)}
              onOpenAi={() => setIsCopilotOpen(true)}
              onEvents={() => setActiveTab('events')}
            />
          )}

          {/* VIEW 2: ADMIN GOVERNANCE DASHBOARD */}
          {currentUser?.role === 'Admin' && (activeTab === 'admin' || activeTab.startsWith('admin-')) && (
            <AdminDashboard currentSection={activeTab.replace('admin-', '')} />
          )}

          {/* VIEW 3: TECHNICIAN HUB WORKSPACE */}
          {activeTab === 'workspace' && (
            <RepairerWorkspace
              requests={requests}
              currentUser={currentUser}
              scanStatusUpdate={scanStatusUpdate}
              onStatusUpdated={handleStatusUpdated}
              onQuoteSubmitted={handleQuoteSubmitted}
              onOpenScanner={(ticket) => {
                setIsScannerOpen(true);
              }}
              onOpenProfile={() => setIsProfileOpen(true)}
              onOpenChat={(ticket) => {
                handleOpenChatForTicket(ticket);
              }}
              unreadChats={unreadChats}
            />
          )}

          {/* VIEW 4: MY REPAIR ORDERS (DASHBOARD) */}
          {activeTab === 'dashboard' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <EnvironmentalImpactCard currentUser={currentUser} />

              {/* Your Appointments Panel */}

              <BookingManagementPanel currentUser={currentUser} newBooking={newConfirmedBooking} />

              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--apple-label)', letterSpacing: '-0.02em', marginBottom: 2 }}>My Repair Orders</h1>
                  <p style={{ fontSize: 13.5, color: 'var(--apple-secondary)', margin: 0 }}>Track status, view payment protection details, and communicate with your technician.</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                  <div style={{ display: 'flex', gap: 4, background: '#E8E8ED', padding: 4, borderRadius: 10 }}>
                    {['All', 'Requested', 'In Progress', 'Ready for Pickup', 'Completed'].map(tab => (
                      <button key={tab} onClick={() => setStatusFilter(tab)} className={`nav-pill ${statusFilter === tab ? 'active' : ''}`} style={{ fontSize: 12.5, padding: '5px 12px' }}>{tab}</button>
                    ))}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {filteredRequests.length === 0 ? (
                  <div className="card" style={{ padding: '48px 24px', textAlign: 'center', background: '#FFFFFF' }}>
                    <div style={{ width: 56, height: 56, borderRadius: 28, background: '#F5EBE6', color: '#CB4D22', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                      <Wrench size={24} />
                    </div>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--apple-label)', margin: '0 0 6px' }}>
                      No Repair Orders Found
                    </h3>
                    <p style={{ fontSize: 13.5, color: 'var(--apple-secondary)', margin: '0 auto 20px', maxWidth: 420 }}>
                      {statusFilter === 'All'
                        ? "You don't have any active repair requests logged yet. Submit your first broken item to get diagnosed and receive bids from verified workshops!"
                        : `No repair orders currently in "${statusFilter}" status.`}
                    </p>
                    <button onClick={() => setActiveTab('request')} className="btn-primary" style={{ gap: 6, margin: '0 auto' }}>
                      <Plus size={14} /> Request a Repair Now
                    </button>
                  </div>
                ) : (
                  filteredRequests.map(req => (
                  <div key={req._id} className="card" style={{ padding: '20px 24px' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <span className="badge badge-blue">{req.ticketNumber}</span>
                          <span style={{ fontSize: 12.5, color: 'var(--apple-secondary)' }}>{req.category}</span>
                          <span style={{ fontSize: 12.5, color: 'var(--apple-tertiary)' }}>{req.date}</span>
                        </div>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--apple-label)', marginBottom: 4 }}>{req.itemTitle}</h3>
                        <p style={{ fontSize: 13.5, color: 'var(--apple-secondary)', margin: 0 }}>{req.issueDescription}</p>
                      </div>

                      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                        {['Requested', 'Quoted'].includes(req.status) && (
                          (req.bids && req.bids.length > 0) ? (
                            <button onClick={() => { setSelectedQuoteTicket(req); setIsQuotesOpen(true); }} className="btn-primary" style={{ fontSize: 12.5, padding: '7px 14px', gap: 5 }}>
                              <DollarSign size={13} /> View {req.bids.length} Bid{req.bids.length > 1 ? 's' : ''}
                            </button>
                          ) : (
                            <button onClick={() => { setSelectedQuoteTicket(req); setIsQuotesOpen(true); }} className="btn-secondary" style={{ fontSize: 12.5, padding: '7px 14px', gap: 5, color: '#C95100', background: '#FFF4E5', borderColor: '#FFE0B2' }}>
                              <Clock size={13} style={{ color: '#FF9500' }} /> Awaiting Bids (0)
                            </button>
                          )
                        )}
                        <button onClick={() => { setSelectedTicket(req); setIsQrOpen(true); }} className="btn-secondary" style={{ fontSize: 12.5, padding: '7px 14px', gap: 5 }}>
                          <QrCode size={13} style={{ color: 'var(--apple-blue)' }} /> Handover QR
                        </button>
                        <button onClick={() => { setSelectedHistoryTicket(req); setIsHistoryOpen(true); }} className="btn-secondary" style={{ fontSize: 12.5, padding: '7px 14px', gap: 5 }}>
                          <History size={13} style={{ color: 'var(--apple-blue)' }} /> Audit Log
                        </button>
                        <button 
                          onClick={() => handleOpenChatForTicket(req)} 
                          className="btn-secondary" 
                          style={{ 
                            fontSize: 12.5, 
                            padding: '7px 14px', 
                            gap: 6, 
                            position: 'relative',
                            background: (unreadChats && (unreadChats[req.ticketNumber] || unreadChats[req._id])) ? '#FFF5F4' : undefined,
                            borderColor: (unreadChats && (unreadChats[req.ticketNumber] || unreadChats[req._id])) ? '#FFCDD2' : undefined,
                          }}
                        >
                          <MessageSquare size={13} style={{ color: (unreadChats && (unreadChats[req.ticketNumber] || unreadChats[req._id])) ? '#CB4D22' : 'var(--apple-blue)' }} /> 
                          <span>Live Chat</span>
                          {Boolean(unreadChats && (unreadChats[req.ticketNumber] || unreadChats[req._id])) && (
                            <span style={{ 
                              background: '#E63946', 
                              color: '#fff', 
                              fontSize: 10, 
                              fontWeight: 700, 
                              borderRadius: 10, 
                              padding: '2px 7px', 
                              lineHeight: 1.1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 3,
                              boxShadow: '0 0 6px rgba(230, 57, 70, 0.4)'
                            }}>
                              <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#FFFFFF', display: 'inline-block' }}></span>
                              {(unreadChats[req.ticketNumber] || unreadChats[req._id]) > 1 ? `${unreadChats[req.ticketNumber] || unreadChats[req._id]} New` : 'New'}
                            </span>
                          )}
                        </button>
                        {req.status === 'Completed' && (
                          (req.hasReviewed || reviewedTicketIds.includes(req._id)) ? (
                            <span
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '6px 14px',
                                background: '#E8FAE8',
                                border: '1px solid #C4F3C4',
                                borderRadius: 980,
                                fontSize: 12,
                                fontWeight: 600,
                                color: '#248A3D',
                              }}
                            >
                              <CheckCircle2 size={13} style={{ color: '#34C759' }} /> Review Published
                            </span>
                          ) : (
                            <button
                              onClick={() => { setSelectedReviewTicket(req); setIsReviewOpen(true); }}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 5,
                                padding: '7px 16px',
                                background: '#FFF4E5',
                                border: '1px solid #FFE0B2',
                                borderRadius: 980,
                                fontSize: 12.5,
                                fontWeight: 600,
                                color: '#C95100',
                                cursor: 'pointer',
                              }}
                            >
                              <Star size={13} style={{ fill: '#FF9500', color: '#FF9500' }} /> Rate Technician
                            </button>
                          )
                        )}
                      </div>
                    </div>

                    <div style={{ marginBottom: 14 }}>
                      <StatusPipeline currentStatus={req.status} />
                    </div>

                    <div style={{ paddingTop: 12, borderTop: '1px solid var(--apple-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 13, color: 'var(--apple-secondary)' }}>
                        <span>Assigned: <strong style={{ color: 'var(--apple-label)', fontWeight: 600 }}>{req.assignedRepairer}</strong></span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <ShieldCheck size={14} style={{ color: 'var(--apple-blue)' }} />
                          Protected Vault: <strong style={{ color: 'var(--apple-blue)', fontWeight: 600 }}>৳{req.quotedPrice}</strong>
                        </span>
                      </div>
                      <span style={{ fontSize: 12.5, fontWeight: 600, color: req.status === 'Completed' ? '#34C759' : req.status === 'Ready for Pickup' ? 'var(--apple-blue)' : 'var(--apple-secondary)' }}>
                        {req.status === 'Ready for Pickup' ? 'Ready for pickup — scan QR to release payment' : req.status === 'Completed' ? '✓ Payment Disbursed to Technician' : 'Vaulted securely in SSLCommerz'}
                      </span>
                    </div>
                  </div>
                ))
              )}
              </div>
            </div>
          )}

          {/* VIEW 5: FIND WORKSHOPS */}
          {activeTab === 'explore' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div>
                <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--apple-label)', letterSpacing: '-0.02em', marginBottom: 4 }}>Find a Repair Workshop</h1>
                <p style={{ fontSize: 14, color: 'var(--apple-secondary)', margin: 0 }}>Browse certified local technicians, filter by category and radius on the live Leaflet map, and book a diagnostic slot.</p>
              </div>
              <InteractiveMap
                repairers={repairers}
                events={events}
                currentUser={currentUser}
                onBookSlot={(repairer) => {
                  if ((currentUser?.role || '').toLowerCase() === 'repairer') {
                    setPromotedToast('Workshops and freelance technicians cannot book diagnostic appointment slots.');
                    setTimeout(() => setPromotedToast(null), 3500);
                    return;
                  }
                  setSelectedBookingRepairer(repairer);
                  setIsBookingOpen(true);
                }}
                onRequestQuote={() => setActiveTab('request')}
                onRSVPEvent={(eventId) => handleRSVPToggle(eventId)}
              />
            </div>
          )}

          {/* VIEW 6: REPAIR CAFES */}
          {activeTab === 'events' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}>
                <div>
                  <h1 style={{ fontSize: 20, fontWeight: 700, color: 'var(--apple-label)', letterSpacing: '-0.02em', marginBottom: 4 }}>Community Repair Cafés</h1>
                  <p style={{ fontSize: 14, color: 'var(--apple-secondary)', margin: 0 }}>Free community fix-it sessions. Bring your broken things and learn DIY repair with experts.</p>
                </div>
                {((currentUser?.role === 'Repairer' || currentUser?.role === 'repairer' || currentUser?.role === 'admin') && currentUser?.technicianType !== 'freelance') ? (
                  <button onClick={() => setIsCreateEventOpen(true)} className="btn-primary" style={{ gap: 6 }}>
                    <Plus size={14} strokeWidth={2.5} /> Host a Repair Café
                  </button>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, background: '#F5EBE6', border: '1px solid #EAE0D6', borderRadius: 980, padding: '7px 14px', fontSize: 12.5, color: '#7A4D00' }}>
                    <ShieldCheck size={14} style={{ color: '#CB4D22' }} />
                    <span>Verified Workshop Hosting Only</span>
                  </div>
                )}
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: 16 }}>
                {events.map(ev => {
                  const isFull = ev.currentRsvps >= ev.capacity;
                  const attending = ev.userStatus === 'Attending' || ev.userStatus?.includes('Organizer');
                  const waitlisted = ev.userStatus?.includes('Waitlisted');
                  return (
                    <div key={ev._id} className="card" style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 14 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                        <h3 style={{ fontSize: 16, fontWeight: 700, color: 'var(--apple-label)', lineHeight: 1.3 }}>{ev.title}</h3>
                        <span className={isFull ? 'badge badge-orange' : 'badge badge-green'} style={{ flexShrink: 0, fontSize: 12 }}>
                          {ev.currentRsvps}/{ev.capacity}{isFull ? ' · Full' : ''}
                        </span>
                      </div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--apple-secondary)' }}>
                          <Calendar size={15} style={{ color: 'var(--apple-blue)', flexShrink: 0 }} />{ev.date} · {ev.time}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13.5, color: 'var(--apple-secondary)' }}>
                          <MapPin size={15} style={{ color: 'var(--apple-blue)', flexShrink: 0 }} />{ev.venue}
                        </div>
                      </div>

                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {(ev.categories || ev.categoriesHandled || []).map((c, i) => <span key={i} className="badge badge-neutral" style={{ fontSize: 12 }}>{c}</span>)}
                      </div>

                      <div style={{ paddingTop: 14, borderTop: '1px solid var(--apple-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 600, color: attending ? '#34C759' : waitlisted ? '#FF9500' : 'var(--apple-tertiary)' }}>
                          {attending ? '✓ Pass Confirmed' : waitlisted ? ev.userStatus : 'Available'}
                        </span>
                        <button
                          onClick={() => handleRSVPToggle(ev._id)}
                          className={attending ? 'btn-secondary' : 'btn-primary'}
                          style={{
                            padding: '8px 18px',
                            fontSize: 13,
                            borderRadius: 980,
                            background: attending ? '#FFEBE9' : isFull ? '#FFF4E5' : 'var(--apple-blue)',
                            color: attending ? 'var(--apple-red)' : isFull ? '#C95100' : '#FFFFFF',
                          }}
                        >
                          {attending ? 'Cancel Pass' : isFull ? 'Join Waitlist' : 'Reserve Free Pass'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* VIEW 7: COMMUNITY DIY GUIDES (MODULE 3 - FR-15 / SPRINT 4) */}
          {activeTab === 'guides' && (
            <CommunityDIYFeed />
          )}

          {/* VIEW 8: MULTI-STEP REPAIR REQUEST WIZARD (MODULE 1 - FR-01, FR-02) */}
          {activeTab === 'request' && (
            <div style={{ maxWidth: 580, margin: '0 auto' }}>
              <div className="card" style={{ padding: '32px 36px' }}>
                <div style={{ marginBottom: 20 }}>
                  <span className="badge badge-orange" style={{ marginBottom: 6 }}>Module 1 · Multi-Step Wizard</span>
                  <h1 style={{ fontSize: 22, fontWeight: 700, color: 'var(--apple-label)', letterSpacing: '-0.02em', margin: '4px 0 6px' }}>
                    Submit a Repair Request
                  </h1>
                  <p style={{ fontSize: 13.5, color: 'var(--apple-secondary)', margin: 0 }}>
                    Certified workshops will review your request, provide diagnostic estimates, and submit competing bids under escrow protection.
                  </p>
                </div>

                {/* Step Progress Pills */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: 24 }}>
                  {[
                    { step: 1, label: '1. Device & Specs' },
                    { step: 2, label: '2. Defect & Photos' },
                    { step: 3, label: '3. Handover & Submit' },
                  ].map((s) => (
                    <button
                      key={s.step}
                      type="button"
                      onClick={() => {
                        if (s.step < wizardStep || (wizardStep === 1 && formData.itemTitle) || (wizardStep === 2 && formData.issueDescription)) {
                          setWizardStep(s.step);
                        }
                      }}
                      style={{
                        padding: '8px 10px',
                        borderRadius: 8,
                        fontSize: 12,
                        fontWeight: wizardStep === s.step ? 700 : 500,
                        background: wizardStep === s.step ? '#F5EBE6' : wizardStep > s.step ? '#EBF8EE' : '#F5F5F7',
                        color: wizardStep === s.step ? '#CB4D22' : wizardStep > s.step ? '#248A3D' : 'var(--apple-secondary)',
                        border: wizardStep === s.step ? '1.5px solid #EAE0D6' : '1px solid transparent',
                        cursor: 'pointer',
                        textAlign: 'center',
                      }}
                    >
                      {s.label}
                    </button>
                  ))}
                </div>

                {formSubmitted ? (
                  <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                    <CheckCircle2 size={48} style={{ color: '#34C759', margin: '0 auto 14px' }} />
                    <h3 style={{ fontSize: 18, fontWeight: 700, color: 'var(--apple-label)', marginBottom: 6 }}>Request Submitted!</h3>
                    <p style={{ fontSize: 14, color: 'var(--apple-secondary)', margin: 0 }}>Your ticket and handover token have been created. Redirecting to your dashboard…</p>
                  </div>
                ) : (
                  <form onSubmit={handleCreateRequest} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    
                    {/* STEP 1: ITEM & CATEGORY HIERARCHY */}
                    {wizardStep === 1 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                          <label className="label">Device Name & Model *</label>
                          <input
                            className="input"
                            type="text"
                            required
                            placeholder="e.g. Sony Bravia 43-inch 4K LED TV or Samsung Microwave"
                            value={formData.itemTitle}
                            onChange={e => setFormData({ ...formData, itemTitle: e.target.value })}
                          />
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <label className="label">Category *</label>
                            <select
                              className="input"
                              value={formData.category}
                              onChange={e => handleCategoryChange(e.target.value)}
                            >
                              {Object.keys(CATEGORY_HIERARCHY).map(c => <option key={c} value={c}>{c}</option>)}
                            </select>
                          </div>
                          <div>
                            <label className="label">Sub-Category *</label>
                            <select
                              className="input"
                              value={formData.subCategory}
                              onChange={e => setFormData({ ...formData, subCategory: e.target.value })}
                            >
                              {(CATEGORY_HIERARCHY[formData.category]?.subCategories || ['General']).map(sc => (
                                <option key={sc} value={sc}>{sc}</option>
                              ))}
                            </select>
                          </div>
                        </div>

                        <div>
                          <label className="label">Item Details & Specifications *</label>
                          <textarea
                            className="input"
                            required
                            rows={3}
                            placeholder="Model number, specifications, purchase year, serial number, general condition..."
                            value={formData.itemDescription}
                            onChange={e => setFormData({ ...formData, itemDescription: e.target.value })}
                            style={{ resize: 'vertical' }}
                          />
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                          <button
                            type="button"
                            disabled={!formData.itemTitle}
                            onClick={() => setWizardStep(2)}
                            className="btn-primary"
                            style={{ gap: 6, padding: '10px 20px', fontSize: 13.5 }}
                          >
                            Continue to Diagnostics <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 2: DEFECT DIAGNOSTICS & PHOTOS */}
                    {wizardStep === 2 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                            <label className="label" style={{ margin: 0 }}>Category Diagnostic Quick-Picks</label>
                            <span style={{ fontSize: 11, color: 'var(--apple-tertiary)' }}>Click to append to defect description</span>
                          </div>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 6 }}>
                            {(CATEGORY_HIERARCHY[formData.category]?.diagnosticPrompts || []).map((prompt, pIdx) => (
                              <button
                                key={pIdx}
                                type="button"
                                onClick={() => handleAppendDiagnosticPrompt(prompt)}
                                style={{
                                  fontSize: 11.5,
                                  padding: '4px 10px',
                                  borderRadius: 980,
                                  background: '#F5F5F7',
                                  border: '1px solid #E5E5EA',
                                  color: 'var(--apple-label)',
                                  cursor: 'pointer',
                                }}
                              >
                                + {prompt}
                              </button>
                            ))}
                          </div>
                        </div>

                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <label className="label" style={{ margin: 0 }}>Describe the Symptom or Defect *</label>
                            <button
                              type="button"
                              onClick={() => setIsCopilotOpen(true)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                background: '#FFFFFF',
                                border: '1px solid #EAE0D6',
                                color: '#2D1B11',
                                borderRadius: 2,
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 1px 2px rgba(45, 27, 17, 0.04)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(203, 77, 34, 0.4)';
                                e.currentTarget.style.color = '#CB4D22';
                                e.currentTarget.style.background = '#F5EBE6';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#EAE0D6';
                                e.currentTarget.style.color = '#2D1B11';
                                e.currentTarget.style.background = '#FFFFFF';
                              }}
                            >
                              <div style={{
                                width: 16,
                                height: 16,
                                borderRadius: 2,
                                background: '#F5EBE6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#CB4D22'
                              }}>
                                <Sparkles size={10} strokeWidth={2.4} />
                              </div>
                              <span>Consult AI Copilot</span>
                            </button>
                          </div>
                          <textarea
                            className="input"
                            required
                            rows={4}
                            placeholder="What is wrong with the device? (e.g. sparks, burning smell, cracked digitizer, power light blinking)..."
                            value={formData.issueDescription}
                            onChange={e => setFormData({ ...formData, issueDescription: e.target.value })}
                            style={{ resize: 'vertical' }}
                          />
                        </div>

                        {/* Photo Attachments & Direct File Upload */}
                        <div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                            <label className="label" style={{ margin: 0 }}>Attach Defect Photos & Scans</label>
                            <button
                              type="button"
                              onClick={() => setIsVisionOpen(true)}
                              style={{
                                display: 'inline-flex',
                                alignItems: 'center',
                                gap: 6,
                                padding: '4px 10px',
                                background: '#FFFFFF',
                                border: '1px solid #EAE0D6',
                                color: '#2D1B11',
                                borderRadius: 2,
                                fontSize: 11.5,
                                fontWeight: 600,
                                cursor: 'pointer',
                                boxShadow: '0 1px 2px rgba(45, 27, 17, 0.04)',
                                transition: 'all 0.15s ease'
                              }}
                              onMouseEnter={(e) => {
                                e.currentTarget.style.borderColor = 'rgba(203, 77, 34, 0.4)';
                                e.currentTarget.style.color = '#CB4D22';
                                e.currentTarget.style.background = '#F5EBE6';
                              }}
                              onMouseLeave={(e) => {
                                e.currentTarget.style.borderColor = '#EAE0D6';
                                e.currentTarget.style.color = '#2D1B11';
                                e.currentTarget.style.background = '#FFFFFF';
                              }}
                            >
                              <div style={{
                                width: 16,
                                height: 16,
                                borderRadius: 2,
                                background: '#F5EBE6',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                color: '#CB4D22'
                              }}>
                                <Camera size={10} strokeWidth={2.4} />
                              </div>
                              <span>AI Vision Damage Scan</span>
                            </button>
                          </div>
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center' }}>
                            <label style={{
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6,
                              padding: '8px 14px',
                              background: '#F5F5F7',
                              border: '1px dashed #C7C7CC',
                              borderRadius: 6,
                              cursor: 'pointer',
                              fontSize: 12.5,
                              fontWeight: 600,
                              color: 'var(--apple-blue)',
                            }}>
                              <UploadCloud size={16} /> Upload Photo(s)
                              <input
                                type="file"
                                accept="image/*"
                                multiple
                                onChange={handlePhotoUpload}
                                style={{ display: 'none' }}
                              />
                            </label>
                            <span style={{ fontSize: 11.5, color: 'var(--apple-secondary)' }}>
                              {(formData.photos?.length || 0) + (formData.photoData ? 1 : 0)} photo(s) attached
                            </span>
                          </div>

                          {/* Previews */}
                          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 10 }}>
                            {formData.photoData && (
                              <div style={{ position: 'relative', width: 64, height: 64, borderRadius: 4, overflow: 'hidden', border: '2px solid #CB4D22' }}>
                                <img src={formData.photoData} alt="AI Damage" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button
                                  type="button"
                                  onClick={() => setFormData({ ...formData, photoData: null, severityScore: null })}
                                  style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: '50%', color: '#fff', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                  ×
                                </button>
                                <span style={{ position: 'absolute', bottom: 0, left: 0, right: 0, background: '#CB4D22', color: '#fff', fontSize: 9, textAlign: 'center', fontWeight: 700 }}>AI Scan</span>
                              </div>
                            )}
                            {(formData.photos || []).map((imgSrc, imgIdx) => (
                              <div key={imgIdx} style={{ position: 'relative', width: 64, height: 64, borderRadius: 4, overflow: 'hidden', border: '1px solid var(--apple-border)' }}>
                                <img src={imgSrc} alt={`Attachment ${imgIdx + 1}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                                <button
                                  type="button"
                                  onClick={() => handleRemovePhoto(imgIdx)}
                                  style={{ position: 'absolute', top: 2, right: 2, background: 'rgba(0,0,0,0.65)', border: 'none', borderRadius: '50%', color: '#fff', width: 18, height: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                                >
                                  ×
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                          <button
                            type="button"
                            onClick={() => setWizardStep(1)}
                            className="btn-secondary"
                            style={{ gap: 6, padding: '10px 16px', fontSize: 13 }}
                          >
                            <ArrowLeft size={14} /> Back
                          </button>
                          <button
                            type="button"
                            disabled={!formData.issueDescription}
                            onClick={() => setWizardStep(3)}
                            className="btn-primary"
                            style={{ gap: 6, padding: '10px 20px', fontSize: 13.5 }}
                          >
                            Continue to Handover <ArrowRight size={14} />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* STEP 3: LOGISTICS & REVIEW */}
                    {wizardStep === 3 && (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                          <div>
                            <label className="label">Handover Method *</label>
                            <select
                              className="input"
                              value={formData.preferredMethod}
                              onChange={e => setFormData({ ...formData, preferredMethod: e.target.value })}
                            >
                              <option value="drop-off">Workshop Drop-Off</option>
                              <option value="pickup">Technician Pickup</option>
                              <option value="mail-in">Courier Drop</option>
                            </select>
                          </div>
                          <div>
                            <label className="label">Drop-off / Pickup Zone</label>
                            <input
                              className="input"
                              type="text"
                              placeholder="e.g. Merul Badda, Dhaka"
                              value={formData.address}
                              onChange={e => setFormData({ ...formData, address: e.target.value })}
                            />
                          </div>
                        </div>

                        {/* Summary Verification Card */}
                        <div style={{ background: '#FDFBF9', border: '1px solid #EAE0D6', borderRadius: 6, padding: '16px 18px' }}>
                          <div style={{ fontSize: 12, fontWeight: 700, color: '#CB4D22', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                            Order Verification Summary
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontSize: 13 }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--apple-secondary)' }}>Item:</span>
                              <strong style={{ color: 'var(--apple-label)' }}>{formData.itemTitle}</strong>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--apple-secondary)' }}>Category:</span>
                              <span>{formData.category} ➔ {formData.subCategory}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--apple-secondary)' }}>Handover:</span>
                              <span style={{ textTransform: 'capitalize' }}>{formData.preferredMethod}</span>
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                              <span style={{ color: 'var(--apple-secondary)' }}>Photos Attached:</span>
                              <span>{(formData.photos?.length || 0) + (formData.photoData ? 1 : 0)} photo(s)</span>
                            </div>
                          </div>
                        </div>

                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                          <button
                            type="button"
                            onClick={() => setWizardStep(2)}
                            className="btn-secondary"
                            style={{ gap: 6, padding: '10px 16px', fontSize: 13 }}
                          >
                            <ArrowLeft size={14} /> Back
                          </button>
                          <button
                            type="submit"
                            className="btn-primary"
                            style={{ gap: 6, padding: '12px 24px', fontSize: 14 }}
                          >
                            Submit & Request Workshop Bids
                          </button>
                        </div>
                      </div>
                    )}

                  </form>
                )}
              </div>
            </div>
          )}

        </main>
        </ErrorBoundary>
      </div>

      {/* Standalone AI Repair Copilot Drawer */}
      <AIRepairCopilotDrawer
        isOpen={isCopilotOpen}
        onClose={() => setIsCopilotOpen(false)}
        onRequestRepair={(diag) => {
          setFormData(prev => ({
            ...prev,
            itemTitle: prev.itemTitle || diag?.deviceType || '',
            issueDescription: prev.issueDescription 
              ? `${prev.issueDescription}\n\n[AI Copilot Diagnosis]: ${diag?.summary}`
              : (diag?.summary || ''),
            estimatedCost: diag?.estimatedCostBDT || prev.estimatedCost,
          }));
          setActiveTab('request');
          setWizardStep(2);
        }}
      />

      {/* Standalone AI Vision Damage Assessment Modal */}
      <AIVisionAssessmentModal
        isOpen={isVisionOpen}
        onClose={() => setIsVisionOpen(false)}
        onRequestRepair={(diag) => {
          setFormData(prev => ({
            ...prev,
            itemTitle: prev.itemTitle || diag?.deviceType || '',
            issueDescription: prev.issueDescription 
              ? `${prev.issueDescription}\n\n[AI Vision Scan]: ${diag?.summary}`
              : (diag?.summary || ''),
            photoData: diag?.photoData || prev.photoData,
            estimatedCost: diag?.estimatedCostBDT || prev.estimatedCost,
            severityScore: diag?.severityScore || prev.severityScore,
          }));
          setActiveTab('request');
          setWizardStep(2);
        }}
      />

      {/* Global Multi-Parameter Search Modal (Module 2 - FR-10) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        repairers={repairers}
        requests={requests}
        events={events}
        onSelectResult={handleSelectSearchResult}
      />

      {/* Create Repair Cafe Event Modal (Module 3 - FR-11) */}
      <CreateEventModal
        isOpen={isCreateEventOpen}
        onClose={() => setIsCreateEventOpen(false)}
        onEventCreated={handleCreateEvent}
        currentUser={currentUser}
      />

      {/* QR Code Handover Modal */}
      <QRCodeModal
        isOpen={isQrOpen}
        onClose={() => setIsQrOpen(false)}
        ticketNumber={selectedTicket?.ticketNumber}
        itemTitle={selectedTicket?.itemTitle}
        requesterName={currentUser?.name || 'Customer'}
      />

      {/* Booking Calendar Modal (Module 2 - FR-08, FR-09) */}
      <BookingCalendarModal
        isOpen={isBookingOpen}
        onClose={() => setIsBookingOpen(false)}
        repairer={selectedBookingRepairer}
        currentUser={currentUser}
        onSwitchRepairer={(alt) => setSelectedBookingRepairer(alt)}
        onBookingConfirmed={(booking) => {
          console.log('[Booking Confirmed]:', booking);
          setNewConfirmedBooking(booking);
          setPromotedToast(`Appointment confirmed with ${booking.repairerName}! Added to Your Appointments.`);
          setActiveTab('dashboard');
          setTimeout(() => setPromotedToast(null), 4000);
        }}
      />

      {/* Multi-Quote Bidding Modal */}
      <MultiQuoteBiddingModal
        isOpen={isQuotesOpen}
        onClose={() => setIsQuotesOpen(false)}
        ticket={selectedQuoteTicket}
        onAcceptQuote={handleAcceptQuote}
      />

      {/* Live In-App Chat Modal */}
      <LiveChatModal
        isOpen={isChatOpen}
        onClose={() => setIsChatOpen(false)}
        ticket={selectedChatTicket}
        currentUser={currentUser}
      />

      {/* QR Scanner Modal for Technicians */}
      <QRScannerModal
        isOpen={isScannerOpen}
        onClose={() => {
          setIsScannerOpen(false);
          setSelectedTicket(null);
        }}
        onScanSuccess={handleScanSuccess}
      />

      {/* Item History Modal (Module 1 - FR-05) */}
      <ItemHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        ticket={selectedHistoryTicket}
        currentUser={currentUser}
      />

      {/* Multi-Criteria Review Modal */}
      <ReviewModal
        isOpen={isReviewOpen}
        onClose={() => setIsReviewOpen(false)}
        ticket={selectedReviewTicket}
        onReviewSubmitted={handleReviewSubmitted}
      />

      {/* Profile & Location Settings Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        currentUser={currentUser}
        onProfileUpdated={(updated) => {
          setCurrentUser(updated);
          setPromotedToast('Profile & Location pin updated successfully');
          setTimeout(() => setPromotedToast(null), 3500);
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthOpen}
        onClose={() => setIsAuthOpen(false)}
        onAuthSuccess={handleAuthSuccess}
      />

      {/* Real-time Inbound Chat Notification Toast */}
      {chatToast && (
        <div
          onClick={() => {
            const targetReq = (requests || []).find(r => 
              (chatToast.ticketNumber && r.ticketNumber === chatToast.ticketNumber) || 
              (chatToast.repairRequestId && r._id === chatToast.repairRequestId) ||
              (chatToast.ticketNumber && r._id === chatToast.ticketNumber)
            );
            handleOpenChatForTicket(targetReq || { 
              ticketNumber: chatToast.ticketNumber, 
              _id: chatToast.repairRequestId,
              customerName: chatToast.senderName,
              assignedRepairer: chatToast.senderName
            });
            setChatToast(null);
          }}
          style={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 9999,
            background: '#2D1B11',
            color: '#FFFFFF',
            borderRadius: 8,
            boxShadow: '0 8px 30px rgba(0,0,0,0.3)',
            border: '1px solid #CB4D22',
            padding: '14px 18px',
            maxWidth: 340,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'flex-start',
            gap: 12,
            transition: 'all 0.2s ease',
          }}
        >
          <div style={{ background: '#CB4D22', borderRadius: '50%', width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageSquare size={16} color="#FFFFFF" />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 2 }}>
              <strong style={{ fontSize: 13, color: '#FFFFFF' }}>{chatToast.senderName}</strong>
              <span style={{ fontSize: 11, color: '#EAE0D6', background: 'rgba(255,255,255,0.15)', padding: '1px 6px', borderRadius: 4 }}>
                #{chatToast.ticketNumber}
              </span>
            </div>
            <p style={{ margin: 0, fontSize: 12.5, color: '#EAE0D6', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
              {chatToast.text}
            </p>
            <div style={{ fontSize: 11, color: '#CB4D22', marginTop: 4, fontWeight: 600 }}>
              Click to reply in Live Chat →
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

