import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ThemeToggle } from '../components/theme/ThemeToggle';
import {
  ScanLine,
  Shield,
  GraduationCap,
  Users,
  ArrowRight,
  CheckCircle2,
  Play,
  Pause,
  RotateCcw,
  Camera,
  Cpu,
  Database,
  Sparkles,
  Clock,
  Lock,
  BarChart3,
  Layers,
  Menu,
  X,
  ChevronRight,
  Eye,
  Activity,
  Zap,
  Radio,
  FileSpreadsheet
} from 'lucide-react';

/* ─── Types & Data ─────────────────────────────────────── */

type WorkflowStepId = 1 | 2 | 3;

interface WorkflowStep {
  id: WorkflowStepId;
  badge: string;
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  specs: { label: string; value: string }[];
  description: string;
  bulletPoints: string[];
}

const WORKFLOW_STEPS: WorkflowStep[] = [
  {
    id: 1,
    badge: 'Step 01: Capture & Isolate',
    title: 'Face Detection',
    subtitle: 'High-speed frame analysis & landmark extraction',
    icon: <Camera className="w-5 h-5" />,
    specs: [
      { label: 'Latency', value: '< 42 ms' },
      { label: 'Landmarks', value: '68 Facial Points' },
      { label: 'Detection Engine', value: 'Haar Cascade / MTCNN' },
      { label: 'Multi-Face Support', value: 'Up to 15 per frame' },
    ],
    description:
      'The optical input pipeline captures video frames in real time, detecting human faces across varying angles, lighting conditions, and partial occlusions with sub-50ms isolation.',
    bulletPoints: [
      'Automatic bounding box alignment with micro-coordinate tracking',
      'Eye, nose bridge, and contour geometry extraction',
      'Adaptive illumination correction for low-light classrooms',
    ],
  },
  {
    id: 2,
    badge: 'Step 02: Embedding & Match',
    title: 'Deep Neural Recognition',
    subtitle: '128-dimensional biometric vector comparison',
    icon: <Cpu className="w-5 h-5" />,
    specs: [
      { label: 'Confidence Score', value: '99.8%' },
      { label: 'Embedding Vector', value: '128-D Euclidean' },
      { label: 'Anti-Spoofing', value: '3D Texture Liveness' },
      { label: 'Database Match', value: 'Encrypted Vector Index' },
    ],
    description:
      'The detected facial geometry is projected into a 128-dimensional embedding space and matched against registered student templates with active liveness verification.',
    bulletPoints: [
      'Eliminates photo, video screen, and printed portrait spoofing',
      'Sub-millisecond Euclidean distance similarity lookup',
      'Robust against facial hair changes, glasses, and aging',
    ],
  },
  {
    id: 3,
    badge: 'Step 03: Atomic Commit & Sync',
    title: 'Mark Attendance',
    subtitle: 'Instant database logging and multi-portal broadcast',
    icon: <Database className="w-5 h-5" />,
    specs: [
      { label: 'Commit Time', value: '< 15 ms' },
      { label: 'Sync Status', value: 'Real-time WebSocket' },
      { label: 'Integrity', value: 'Zero Proxy Guaranteed' },
      { label: 'Audit Trail', value: 'Timestamped & Verified' },
    ],
    description:
      'Upon identity verification, an atomic record is committed to the class attendance session with automated notifications sent to Educator, Admin, and Student portals.',
    bulletPoints: [
      'Direct synchronization with course timetable and room schedules',
      'Instant dashboard update with visual presence indicators',
      'Automated absentee notification and percentage compliance checks',
    ],
  },
];

const STATS_DATA = [
  {
    value: 99.8,
    suffix: '%',
    label: 'Recognition Accuracy',
    description: 'Precision verified across diverse lighting & angled perspectives',
    icon: <Sparkles className="w-5 h-5 text-sky-400" />,
  },
  {
    value: 0.3,
    prefix: '< ',
    suffix: 's',
    label: 'Identification Latency',
    description: 'Sub-second multi-candidate matching per captured frame',
    icon: <Zap className="w-5 h-5 text-amber-400" />,
  },
  {
    value: 100,
    suffix: '%',
    label: 'Automated & Paperless',
    description: 'Zero paper roll-calls, manual data entry, or proxy sign-ins',
    icon: <CheckCircle2 className="w-5 h-5 text-emerald-400" />,
  },
  {
    value: 10000,
    suffix: '+',
    label: 'Daily Safe Verifications',
    description: 'Production-ready throughput for high-density academic campuses',
    icon: <Activity className="w-5 h-5 text-purple-400" />,
  },
];

const ROLE_CARDS = [
  {
    role: 'admin',
    title: 'Institution Administrator',
    subtitle: 'Centralized biometric governance & system intelligence',
    icon: <Shield className="w-6 h-6 text-white" />,
    gradient: 'from-primary-600 to-sky-600',
    borderGlow: 'hover:border-primary-500/60 hover:shadow-primary-500/10',
    accentBadge: 'bg-primary-500/10 text-primary-400 border-primary-500/20',
    actionText: 'Access Admin Console',
    features: [
      'Facial recognition model training & dataset enrollment',
      'Student, teacher, department, and class roster governance',
      'Campus-wide attendance reports & CSV/Excel export',
      'Timetable scheduling and comprehensive audit logging',
    ],
  },
  {
    role: 'teacher',
    title: 'Classroom Educator',
    subtitle: '1-click session launch & live classroom presence',
    icon: <GraduationCap className="w-6 h-6 text-white" />,
    gradient: 'from-emerald-600 to-teal-600',
    borderGlow: 'hover:border-emerald-500/60 hover:shadow-emerald-500/10',
    accentBadge: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    actionText: 'Launch Educator Portal',
    features: [
      'One-click biometric attendance session activation',
      'Live camera feed with real-time student recognition cards',
      'Manual override options for late arrivals or exceptions',
      'Subject-wise historical attendance trends & engagement metrics',
    ],
  },
  {
    role: 'student',
    title: 'Enrolled Student',
    subtitle: 'Transparent attendance records, percentages & streaks',
    icon: <Users className="w-6 h-6 text-white" />,
    gradient: 'from-violet-600 to-purple-600',
    borderGlow: 'hover:border-violet-500/60 hover:shadow-violet-500/10',
    accentBadge: 'bg-violet-500/10 text-violet-400 border-violet-500/20',
    actionText: 'Open Student Portal',
    features: [
      'Contactless, instant presence marking without queues',
      'Personal attendance percentage tracking per course',
      'Timely warnings before dropping below mandatory threshold',
      'Daily class schedules, room allocations, and verified timestamps',
    ],
  },
];

const FEATURES_LIST = [
  {
    icon: <Shield className="w-6 h-6 text-primary-400" />,
    title: 'Anti-Spoofing & Liveness',
    description:
      'Integrated 3D texture and micro-motion detection thwarts static photographs, mobile screen replays, and silicone masks.',
  },
  {
    icon: <Zap className="w-6 h-6 text-amber-400" />,
    title: 'Sub-Second Detection',
    description:
      'Optimized OpenCV and Euclidean matching pipeline isolates and classifies facial embeddings in less than 300 milliseconds.',
  },
  {
    icon: <Clock className="w-6 h-6 text-sky-400" />,
    title: 'Automated Timetable Sync',
    description:
      'Attendance sessions automatically map to active academic timetables, class periods, and registered subject faculty.',
  },
  {
    icon: <BarChart3 className="w-6 h-6 text-emerald-400" />,
    title: 'Analytics & Compliance',
    description:
      'Granular attendance percentage breakdowns, chronic absenteeism alerts, and export-ready CSV records for administrative audits.',
  },
  {
    icon: <Lock className="w-6 h-6 text-indigo-400" />,
    title: 'Encrypted Biometric Vectors',
    description:
      'Raw camera frames are processed on-the-fly and converted into encrypted irreversible vectors, preserving student data privacy.',
  },
  {
    icon: <Layers className="w-6 h-6 text-purple-400" />,
    title: 'Cross-Device Responsive',
    description:
      'Designed to run seamlessly across administrative desktop stations, classroom teacher laptops, and student mobile devices.',
  },
];

/* ─── Animated Number Component ────────────────────────── */

const AnimatedNumber: React.FC<{
  value: number;
  prefix?: string;
  suffix?: string;
  isVisible: boolean;
}> = ({ value, prefix = '', suffix = '', isVisible }) => {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    if (!isVisible) return;

    let start = 0;
    const duration = 1200; // ms
    const startTime = performance.now();
    const isDecimal = value % 1 !== 0;

    const update = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const easeProgress = 1 - Math.pow(1 - progress, 3);
      const current = start + (value - start) * easeProgress;

      setDisplayValue(isDecimal ? parseFloat(current.toFixed(1)) : Math.floor(current));

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayValue(value);
      }
    };

    const handle = requestAnimationFrame(update);
    return () => cancelAnimationFrame(handle);
  }, [isVisible, value]);

  return (
    <span>
      {prefix}
      {displayValue.toLocaleString()}
      {suffix}
    </span>
  );
};

/* ─── Main Landing Page Component ──────────────────────── */

export const Landing: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // Mobile menu state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Workflow interactive state
  const [activeStep, setActiveStep] = useState<WorkflowStepId>(1);
  const [isAutoSimulating, setIsAutoSimulating] = useState(false);
  const [simulationProgress, setSimulationProgress] = useState(0);

  // Scanner HUD interactive state
  const [isLaserActive, setIsLaserActive] = useState(true);
  const [showMeshLandmarks, setShowMeshLandmarks] = useState(true);
  const [isFlashActive, setIsFlashActive] = useState(false);

  // Scroll visibility for statistics
  const [statsVisible, setStatsVisible] = useState(false);
  const statsRef = useRef<HTMLDivElement | null>(null);

  // IntersectionObserver for stats counter
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setStatsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.25 }
    );

    if (statsRef.current) {
      observer.observe(statsRef.current);
    }

    return () => observer.disconnect();
  }, []);

  // Workflow auto simulation timer
  useEffect(() => {
    if (!isAutoSimulating) {
      setSimulationProgress(0);
      return;
    }

    const intervalTime = 30; // 30ms ticks
    const stepDuration = 2800; // ms per step
    const totalTicks = stepDuration / intervalTime;

    const timer = setInterval(() => {
      setSimulationProgress((prev) => {
        const next = prev + 100 / totalTicks;
        if (next >= 100) {
          setActiveStep((current) => (current === 3 ? 1 : ((current + 1) as WorkflowStepId)));
          return 0;
        }
        return next;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isAutoSimulating]);

  // Handle flash capture demo
  const triggerScanFlash = () => {
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 300);
  };

  // Helper for dashboard redirect based on role
  const getDashboardPath = () => {
    if (user?.role === 'TEACHER') return '/teacher/dashboard';
    if (user?.role === 'STUDENT') return '/student/dashboard';
    return '/dashboard';
  };

  const handleGetStarted = () => {
    if (isAuthenticated) {
      navigate(getDashboardPath());
    } else {
      navigate('/login');
    }
  };

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 selection:bg-primary-500 selection:text-white relative overflow-x-hidden font-sans">
      {/* Dynamic ambient background glow */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute -top-40 left-1/4 w-[600px] h-[600px] bg-primary-600/12 rounded-full blur-[140px] animate-pulseGlow" />
        <div className="absolute top-1/3 -right-40 w-[500px] h-[500px] bg-sky-500/10 rounded-full blur-[140px] animate-pulseGlow" />
        <div className="absolute -bottom-40 left-1/3 w-[650px] h-[650px] bg-indigo-600/10 rounded-full blur-[150px] animate-pulseGlow" />
        {/* Subtle dot matrix grid */}
        <div
          className="absolute inset-0 opacity-[0.03] dark:opacity-[0.05]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '36px 36px',
          }}
        />
      </div>

      {/* ─── Sticky Glass Navbar ─────────────────────────────── */}
      <header className="sticky top-0 z-50 w-full backdrop-blur-xl bg-slate-950/80 border-b border-slate-800/80 transition-all duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between">
          {/* Logo brand */}
          <div
            onClick={() => scrollToSection('hero')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-primary-600 via-primary-500 to-sky-400 p-[1px] shadow-lg shadow-primary-500/20 group-hover:shadow-primary-500/40 transition-all duration-300">
              <div className="w-full h-full bg-slate-950 rounded-[11px] flex items-center justify-center">
                <ScanLine className="w-5 h-5 text-primary-400 group-hover:scale-110 transition-transform duration-300" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-extrabold tracking-tight text-white group-hover:text-primary-300 transition-colors">
                  FRAS
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-bold tracking-wider rounded bg-primary-500/15 border border-primary-500/30 text-primary-400">
                  AI v2.4
                </span>
              </div>
              <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
                Face Recognition Attendance System
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 lg:gap-2 text-sm font-medium text-slate-300">
            <button
              onClick={() => scrollToSection('hero')}
              className="px-3 py-2 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              Overview
            </button>
            <button
              onClick={() => scrollToSection('workflow')}
              className="px-3 py-2 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              How It Works
            </button>
            <button
              onClick={() => scrollToSection('roles')}
              className="px-3 py-2 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              Role Portals
            </button>
            <button
              onClick={() => scrollToSection('stats')}
              className="px-3 py-2 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              Metrics
            </button>
            <button
              onClick={() => scrollToSection('features')}
              className="px-3 py-2 rounded-lg hover:text-white hover:bg-slate-800/60 transition-colors"
            >
              Features
            </button>
          </nav>

          {/* Right Action Buttons */}
          <div className="hidden sm:flex items-center gap-3">
            <ThemeToggle />

            {isAuthenticated ? (
              <button
                onClick={handleGetStarted}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-sky-600 hover:from-primary-500 hover:to-sky-500 text-white shadow-lg shadow-primary-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
              >
                <span>Dashboard ({user?.role})</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => navigate('/login')}
                  className="px-3.5 py-2 rounded-xl text-sm font-medium text-slate-300 hover:text-white hover:bg-slate-800/70 border border-slate-700/60 transition-all duration-150"
                >
                  Sign In
                </button>
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 to-sky-600 hover:from-primary-500 hover:to-sky-500 text-white shadow-lg shadow-primary-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          <div className="flex sm:hidden items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
              aria-label="Toggle menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="sm:hidden border-b border-slate-800 bg-slate-950/95 backdrop-blur-2xl px-4 py-5 animate-fadeInFast">
            <div className="flex flex-col gap-2">
              <button
                onClick={() => scrollToSection('hero')}
                className="text-left px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800/70 text-sm font-medium"
              >
                Overview
              </button>
              <button
                onClick={() => scrollToSection('workflow')}
                className="text-left px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800/70 text-sm font-medium"
              >
                How It Works
              </button>
              <button
                onClick={() => scrollToSection('roles')}
                className="text-left px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800/70 text-sm font-medium"
              >
                Role Portals
              </button>
              <button
                onClick={() => scrollToSection('stats')}
                className="text-left px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800/70 text-sm font-medium"
              >
                Metrics
              </button>
              <button
                onClick={() => scrollToSection('features')}
                className="text-left px-3 py-2.5 rounded-lg text-slate-200 hover:bg-slate-800/70 text-sm font-medium"
              >
                Features
              </button>

              <div className="pt-4 border-t border-slate-800/80 flex flex-col gap-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className="w-full py-2.5 rounded-xl text-center text-sm font-medium text-slate-200 border border-slate-700/80 bg-slate-900"
                >
                  Sign In to FRAS
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    handleGetStarted();
                  }}
                  className="w-full py-2.5 rounded-xl text-center text-sm font-semibold text-white bg-gradient-to-r from-primary-600 to-sky-600 shadow-md shadow-primary-500/20"
                >
                  {isAuthenticated ? `Go to Dashboard (${user?.role})` : 'Get Started Now'}
                </button>
              </div>
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero Section ────────────────────────────────────── */}
      <section id="hero" className="relative z-10 pt-12 pb-20 sm:pt-20 sm:pb-28 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
            {/* Left Hero Content */}
            <div className="lg:col-span-7 flex flex-col items-start text-left animate-slideInUp">
              {/* Status Pill */}
              <div className="inline-flex items-center gap-2.5 px-3.5 py-1.5 rounded-full bg-slate-900/90 border border-primary-500/30 text-xs font-semibold text-primary-300 shadow-sm mb-6">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                </span>
                <span>Next-Gen Biometric Attendance System</span>
                <span className="text-slate-500">•</span>
                <span className="text-emerald-400 font-mono">Live v2.4</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight text-white leading-[1.1] mb-6">
                Frictionless Attendance with{' '}
                <span className="bg-gradient-to-r from-primary-400 via-sky-300 to-cyan-400 bg-clip-text text-transparent">
                  Intelligent Face Recognition
                </span>
              </h1>

              {/* Subtitle */}
              <p className="text-base sm:text-lg text-slate-300 leading-relaxed max-w-2xl mb-8">
                Eliminate proxies, long roll-call queues, and paper registers. FRAS combines
                ultra-fast facial isolation with 128-D neural embeddings to detect, verify, and
                record classroom attendance in under <strong className="text-white">300ms</strong> with{' '}
                <strong className="text-white">99.8% precision</strong>.
              </p>

              {/* Hero Action Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5 w-full sm:w-auto mb-10">
                <button
                  onClick={handleGetStarted}
                  className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-600 via-primary-500 to-sky-500 hover:from-primary-500 hover:to-sky-400 text-white shadow-xl shadow-primary-500/25 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <span>{isAuthenticated ? 'Open Dashboard' : 'Get Started Now'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => scrollToSection('workflow')}
                  className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-medium text-slate-200 bg-slate-900/90 hover:bg-slate-800/90 border border-slate-700/80 hover:border-slate-600 transition-all duration-150"
                >
                  <Play className="w-4 h-4 text-primary-400 fill-primary-400/20" />
                  <span>Interactive Workflow</span>
                </button>
              </div>

              {/* Key Trust Highlights */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-6 border-t border-slate-800/80 w-full">
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Zero Proxy Guaranteed</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>3D Liveness Verified</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Sub-300ms Match</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-400">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                  <span>Multi-Role RBAC</span>
                </div>
              </div>
            </div>

            {/* Right Hero Interactive Biometric HUD */}
            <div className="lg:col-span-5 flex justify-center animate-scaleUpFast">
              <div className="w-full max-w-md bg-slate-900/90 border border-slate-800 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-2xl relative overflow-hidden group">
                {/* Ambient glow inside HUD */}
                <div className="absolute -top-20 -right-20 w-44 h-44 bg-primary-500/15 rounded-full blur-2xl pointer-events-none" />
                <div className="absolute -bottom-20 -left-20 w-44 h-44 bg-sky-500/15 rounded-full blur-2xl pointer-events-none" />

                {/* HUD Header bar */}
                <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-800 text-xs text-slate-400">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-ping inline-block" />
                    <span className="font-mono text-emerald-400 font-semibold tracking-wider">
                      CAM-01 • ACTIVE
                    </span>
                  </div>
                  <div className="flex items-center gap-3 font-mono text-[11px]">
                    <span className="text-slate-400">1080p 60FPS</span>
                    <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                      LIVE
                    </span>
                  </div>
                </div>

                {/* Biometric Viewport Frame */}
                <div className="relative aspect-[4/3] rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center overflow-hidden">
                  {/* Subtle grid pattern inside camera */}
                  <div
                    className="absolute inset-0 opacity-15"
                    style={{
                      backgroundImage: `linear-gradient(to right, #0ea5e9 1px, transparent 1px), linear-gradient(to bottom, #0ea5e9 1px, transparent 1px)`,
                      backgroundSize: '24px 24px',
                    }}
                  />

                  {/* Simulated Flash Capture Effect */}
                  {isFlashActive && (
                    <div className="absolute inset-0 bg-white/40 z-30 pointer-events-none transition-opacity duration-300" />
                  )}

                  {/* Corner Reticle Brackets */}
                  <div className="absolute inset-6 pointer-events-none z-10 flex flex-col justify-between">
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-t-2 border-l-2 border-primary-400 rounded-tl-sm animate-pulse" />
                      <div className="w-6 h-6 border-t-2 border-r-2 border-primary-400 rounded-tr-sm animate-pulse" />
                    </div>
                    <div className="flex justify-between">
                      <div className="w-6 h-6 border-b-2 border-l-2 border-primary-400 rounded-bl-sm animate-pulse" />
                      <div className="w-6 h-6 border-b-2 border-r-2 border-primary-400 rounded-br-sm animate-pulse" />
                    </div>
                  </div>

                  {/* Sweeping Laser Beam Scanline */}
                  {isLaserActive && (
                    <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-[0_0_15px_#38bdf8] z-20 animate-scanBeam pointer-events-none" />
                  )}

                  {/* Central Face Silhouette / Landmark Mesh */}
                  <div className="relative flex flex-col items-center justify-center z-10">
                    {/* Bounding box */}
                    <div className="w-36 h-44 rounded-2xl border-2 border-primary-500/80 bg-primary-500/5 relative flex flex-col items-center justify-center shadow-[0_0_20px_rgba(14,165,233,0.2)]">
                      {/* Bounding box label */}
                      <div className="absolute -top-3 left-2 px-1.5 py-0.5 rounded bg-primary-600 text-[9px] font-mono font-bold text-white uppercase tracking-wider">
                        FACE #1 • 99.8%
                      </div>

                      {/* Face contour icon representation */}
                      <div className="w-20 h-28 border border-primary-400/40 rounded-full flex flex-col items-center justify-center relative">
                        {/* Eyes */}
                        <div className="flex gap-6 mb-2">
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400/80 shadow-[0_0_6px_#38bdf8] animate-ping" />
                          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400/80 shadow-[0_0_6px_#38bdf8] animate-ping" />
                        </div>
                        {/* Nose bridge */}
                        <span className="w-1.5 h-3 rounded-full bg-sky-300/80 mb-2" />
                        {/* Mouth smile line */}
                        <span className="w-6 h-1 rounded-full bg-cyan-400/80" />

                        {/* Additional Landmark Dots if toggled */}
                        {showMeshLandmarks && (
                          <>
                            <span className="absolute top-4 left-1 w-1.5 h-1.5 rounded-full bg-emerald-400/90 animate-pulse" />
                            <span className="absolute top-4 right-1 w-1.5 h-1.5 rounded-full bg-emerald-400/90 animate-pulse" />
                            <span className="absolute bottom-5 left-2 w-1.5 h-1.5 rounded-full bg-emerald-400/90 animate-pulse" />
                            <span className="absolute bottom-5 right-2 w-1.5 h-1.5 rounded-full bg-emerald-400/90 animate-pulse" />
                            <span className="absolute bottom-1 w-1.5 h-1.5 rounded-full bg-emerald-400/90 animate-pulse" />
                          </>
                        )}
                      </div>

                      {/* Coordinates tag */}
                      <div className="absolute -bottom-2.5 right-2 px-1 py-0.5 rounded bg-slate-900 border border-slate-700 text-[8px] font-mono text-slate-300">
                        X:342 Y:198 W:144
                      </div>
                    </div>
                  </div>

                  {/* Floating Telemetry Chips */}
                  <div className="absolute top-3 left-3 z-20">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-700/80 text-[10px] font-mono text-emerald-400 flex items-center gap-1 shadow">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Liveness: 3D PASS
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 z-20">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-700/80 text-[10px] font-mono text-slate-300 flex items-center gap-1 shadow">
                      Latency: <strong className="text-white">28ms</strong>
                    </span>
                  </div>

                  <div className="absolute bottom-3 right-3 z-20">
                    <span className="px-2 py-0.5 rounded-md bg-slate-900/90 border border-slate-700/80 text-[10px] font-mono text-primary-300 flex items-center gap-1 shadow">
                      Algorithm: MTCNN+LBPH
                    </span>
                  </div>
                </div>

                {/* Interactive Controls for HUD */}
                <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setIsLaserActive(!isLaserActive)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        isLaserActive
                          ? 'bg-primary-500/20 text-primary-300 border-primary-500/40'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                      title="Toggle scanning laser beam"
                    >
                      Laser {isLaserActive ? 'ON' : 'OFF'}
                    </button>
                    <button
                      onClick={() => setShowMeshLandmarks(!showMeshLandmarks)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-colors ${
                        showMeshLandmarks
                          ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
                          : 'bg-slate-800/60 text-slate-400 border-slate-700 hover:text-slate-200'
                      }`}
                      title="Toggle facial landmark dots"
                    >
                      Landmarks
                    </button>
                  </div>

                  <button
                    onClick={triggerScanFlash}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5 text-primary-400" />
                    <span>Test Capture</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Interactive Workflow Section ───────────────────── */}
      <section id="workflow" className="relative z-10 py-20 bg-slate-900/40 border-y border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Section Header */}
          <div className="text-center max-w-3xl mx-auto mb-14">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-semibold text-primary-400 mb-3">
              <Activity className="w-3.5 h-3.5" />
              <span>Biometric Pipeline</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
              Detect → Recognize → Mark Attendance
            </h2>
            <p className="text-slate-300 text-base">
              Explore how FRAS transitions from live video feed capture to atomic attendance record
              commit in milliseconds. Click any phase or start the auto simulator.
            </p>

            {/* Simulation controls */}
            <div className="mt-6 flex items-center justify-center gap-3">
              <button
                onClick={() => setIsAutoSimulating(!isAutoSimulating)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-semibold transition-all ${
                  isAutoSimulating
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                    : 'bg-primary-600 hover:bg-primary-500 text-white shadow-md shadow-primary-500/20'
                }`}
              >
                {isAutoSimulating ? (
                  <>
                    <Pause className="w-3.5 h-3.5" />
                    <span>Pause Simulation</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5" />
                    <span>Run Auto Simulation</span>
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setIsAutoSimulating(false);
                  setActiveStep(1);
                  setSimulationProgress(0);
                }}
                className="px-3 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-slate-200 bg-slate-800/60 border border-slate-700/80 transition-colors"
              >
                Reset
              </button>
            </div>

            {/* Progress bar when simulating */}
            {isAutoSimulating && (
              <div className="mt-4 max-w-xs mx-auto w-full bg-slate-800 rounded-full h-1.5 overflow-hidden">
                <div
                  className="bg-primary-500 h-full transition-all duration-75"
                  style={{ width: `${simulationProgress}%` }}
                />
              </div>
            )}
          </div>

          {/* Workflow Interactive Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Step Selection Cards (Col 1-5) */}
            <div className="lg:col-span-5 flex flex-col gap-3.5">
              {WORKFLOW_STEPS.map((step) => {
                const isActive = activeStep === step.id;
                return (
                  <div
                    key={step.id}
                    onClick={() => {
                      setIsAutoSimulating(false);
                      setActiveStep(step.id);
                    }}
                    className={`p-5 rounded-2xl border cursor-pointer transition-all duration-200 text-left relative overflow-hidden ${
                      isActive
                        ? 'bg-slate-900 border-primary-500/70 shadow-lg shadow-primary-500/10 scale-[1.01]'
                        : 'bg-slate-900/50 border-slate-800 hover:border-slate-700 hover:bg-slate-900/80'
                    }`}
                  >
                    {/* Active accent edge */}
                    {isActive && (
                      <div className="absolute top-0 left-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-sky-400" />
                    )}

                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2.5">
                        <div
                          className={`w-9 h-9 rounded-xl flex items-center justify-center transition-colors ${
                            isActive
                              ? 'bg-primary-600 text-white shadow-md shadow-primary-500/30'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {step.icon}
                        </div>
                        <div>
                          <span
                            className={`text-xs font-mono font-semibold ${
                              isActive ? 'text-primary-400' : 'text-slate-400'
                            }`}
                          >
                            {step.badge}
                          </span>
                          <h3 className="text-base font-bold text-white">{step.title}</h3>
                        </div>
                      </div>

                      <ChevronRight
                        className={`w-5 h-5 transition-transform duration-200 ${
                          isActive
                            ? 'text-primary-400 translate-x-1'
                            : 'text-slate-600 group-hover:text-slate-400'
                        }`}
                      />
                    </div>

                    <p className="text-xs text-slate-300 pl-11">{step.subtitle}</p>
                  </div>
                );
              })}
            </div>

            {/* Step Detail Live Monitor (Col 6-12) */}
            <div className="lg:col-span-7">
              {(() => {
                const current = WORKFLOW_STEPS.find((s) => s.id === activeStep)!;
                return (
                  <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 sm:p-8 shadow-2xl backdrop-blur-xl relative overflow-hidden">
                    {/* Monitor Top Bar */}
                    <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-800">
                      <div className="flex items-center gap-3">
                        <div className="flex gap-1.5">
                          <span className="w-3 h-3 rounded-full bg-rose-500/80 inline-block" />
                          <span className="w-3 h-3 rounded-full bg-amber-500/80 inline-block" />
                          <span className="w-3 h-3 rounded-full bg-emerald-500/80 inline-block" />
                        </div>
                        <span className="text-xs font-mono text-slate-400">
                          PIPELINE STAGE: {current.title.toUpperCase()}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full bg-primary-500/15 border border-primary-500/30 text-primary-400 text-xs font-mono font-semibold">
                        STATUS: ACTIVE
                      </span>
                    </div>

                    {/* Step Visual Preview Display */}
                    <div className="mb-6 rounded-2xl bg-slate-950 border border-slate-800 p-5 relative overflow-hidden">
                      {/* Step 1 Visual: Face Detection */}
                      {current.id === 1 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
                          <div className="relative w-36 h-36 rounded-2xl bg-slate-900 border-2 border-primary-500 flex items-center justify-center">
                            <span className="absolute -top-2.5 left-2 px-1.5 py-0.5 rounded bg-primary-600 text-[9px] font-mono text-white">
                              DETECTED
                            </span>
                            <div className="w-20 h-24 border border-cyan-400/50 rounded-full flex flex-col items-center justify-center relative">
                              <div className="flex gap-4 mb-2">
                                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                              </div>
                              <span className="w-1 h-2 rounded-full bg-cyan-400 mb-1" />
                              <span className="w-4 h-0.5 rounded-full bg-cyan-400" />
                            </div>
                            <div className="absolute inset-0 bg-cyan-400/10 pointer-events-none" />
                          </div>
                          <div className="flex-1 space-y-2 text-left">
                            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-mono">
                              <CheckCircle2 className="w-3.5 h-3.5" />
                              Face Isolated: Candidate #01
                            </div>
                            <div className="text-xs font-mono text-slate-300">
                              Bounding Box: [X: 240, Y: 180, W: 160, H: 210]
                            </div>
                            <div className="text-xs font-mono text-slate-400">
                              Landmark Alignment: 68 points localized in 38ms
                            </div>
                            <div className="text-xs text-slate-400">
                              Frame normalized for rotation, pitch, and lighting variances.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 2 Visual: Neural Recognition */}
                      {current.id === 2 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
                          <div className="relative w-36 h-36 rounded-2xl bg-slate-900 border-2 border-purple-500 flex flex-col items-center justify-center p-3 text-center">
                            <div className="w-12 h-12 rounded-xl bg-purple-600/20 border border-purple-500/40 flex items-center justify-center mb-2">
                              <Cpu className="w-6 h-6 text-purple-400" />
                            </div>
                            <span className="text-[10px] font-mono text-purple-300 font-semibold">
                              128-D EMBEDDING
                            </span>
                            <span className="text-[9px] font-mono text-emerald-400 mt-1">
                              Match: 99.8%
                            </span>
                          </div>
                          <div className="flex-1 space-y-2 text-left">
                            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800 text-purple-300 text-xs font-mono">
                              <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                              Identified: Alex Mercer (CS-2024-042)
                            </div>
                            <div className="text-xs font-mono text-slate-300">
                              Euclidean Distance: 0.18 (Threshold &lt; 0.45)
                            </div>
                            <div className="text-xs font-mono text-slate-400">
                              Liveness Check: 3D Depth Texture Verified (PASS)
                            </div>
                            <div className="text-xs text-slate-400">
                              Biometric vector safely validated without storing raw image files.
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Step 3 Visual: Mark Attendance */}
                      {current.id === 3 && (
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 py-2">
                          <div className="relative w-36 h-36 rounded-2xl bg-emerald-950/40 border-2 border-emerald-500 flex flex-col items-center justify-center p-3 text-center shadow-lg shadow-emerald-500/10">
                            <div className="w-12 h-12 rounded-full bg-emerald-500/20 border border-emerald-400 flex items-center justify-center mb-2">
                              <CheckCircle2 className="w-7 h-7 text-emerald-400" />
                            </div>
                            <span className="text-[11px] font-bold text-emerald-300 tracking-wider">
                              PRESENT
                            </span>
                            <span className="text-[9px] font-mono text-slate-400">
                              09:02:14 AM
                            </span>
                          </div>
                          <div className="flex-1 space-y-2 text-left">
                            <div className="inline-flex items-center gap-2 px-2 py-0.5 rounded bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-mono">
                              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                              Database Commit: Success (12ms)
                            </div>
                            <div className="text-xs font-mono text-slate-300">
                              Course: CS301 - Operating Systems (Prof. Davis)
                            </div>
                            <div className="text-xs font-mono text-slate-400">
                              Session ID: #SESS-2026-9042 • Roster Updated
                            </div>
                            <div className="text-xs text-slate-400">
                              Real-time broadcast pushed to Student and Educator dashboards.
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Technical Specs Metric Cards */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                      {current.specs.map((spec, i) => (
                        <div
                          key={i}
                          className="bg-slate-950/80 border border-slate-800 rounded-xl p-3 text-left"
                        >
                          <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
                            {spec.label}
                          </span>
                          <span className="text-xs sm:text-sm font-bold text-white block">
                            {spec.value}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Step Explanatory Content */}
                    <div className="text-left space-y-3">
                      <p className="text-sm text-slate-300 leading-relaxed">
                        {current.description}
                      </p>
                      <ul className="space-y-2 pt-1">
                        {current.bulletPoints.map((bp, i) => (
                          <li key={i} className="flex items-center gap-2 text-xs text-slate-400">
                            <span className="w-1.5 h-1.5 rounded-full bg-primary-400 shrink-0" />
                            <span>{bp}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Animated Statistics Section ────────────────────── */}
      <section ref={statsRef} id="stats" className="relative z-10 py-20 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/10 border border-sky-500/20 text-xs font-semibold text-sky-400 mb-3">
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Proven Performance</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
              Engineered for Speed, Precision & Scale
            </h2>
            <p className="text-slate-300 text-base">
              FRAS is rigorously tested to perform seamlessly in real-world academic lecture halls
              with variable classroom illumination and high-density student movement.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {STATS_DATA.map((stat, idx) => (
              <div
                key={idx}
                className="bg-slate-900/70 border border-slate-800 rounded-3xl p-6 text-left hover:border-slate-700 hover:bg-slate-900/90 transition-all duration-200 group"
              >
                <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  {stat.icon}
                </div>
                <div className="text-3xl sm:text-4xl font-black text-white tracking-tight mb-2">
                  <AnimatedNumber
                    value={stat.value}
                    prefix={stat.prefix}
                    suffix={stat.suffix}
                    isVisible={statsVisible}
                  />
                </div>
                <h3 className="text-sm font-bold text-slate-200 mb-1.5">{stat.label}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">{stat.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Role-Based Portals Section ─────────────────────── */}
      <section id="roles" className="relative z-10 py-20 bg-slate-900/40 border-t border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-500/10 border border-primary-500/20 text-xs font-semibold text-primary-400 mb-3">
              <Users className="w-3.5 h-3.5" />
              <span>Multi-Role RBAC</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
              Tailored Portals for Every Campus Stakeholder
            </h2>
            <p className="text-slate-300 text-base">
              FRAS equips Administrators, Classroom Educators, and Students with dedicated,
              secure interfaces built specifically for their daily academic workflows.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {ROLE_CARDS.map((card) => (
              <div
                key={card.role}
                className={`bg-slate-900/80 border border-slate-800 rounded-3xl p-6 sm:p-7 flex flex-col justify-between transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl ${card.borderGlow} group`}
              >
                <div>
                  {/* Role Icon Header */}
                  <div className="flex items-center justify-between mb-6">
                    <div
                      className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${card.gradient} flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform`}
                    >
                      {card.icon}
                    </div>
                    <span
                      className={`text-xs font-mono font-bold uppercase tracking-wider px-2.5 py-1 rounded-lg border ${card.accentBadge}`}
                    >
                      {card.role}
                    </span>
                  </div>

                  {/* Title & Subtitle */}
                  <h3 className="text-xl font-bold text-white mb-2">{card.title}</h3>
                  <p className="text-xs text-slate-400 mb-6">{card.subtitle}</p>

                  {/* Capabilities List */}
                  <div className="space-y-3 mb-8">
                    <span className="text-[11px] font-mono font-semibold uppercase tracking-wider text-slate-400 block">
                      Core Capabilities
                    </span>
                    {card.features.map((feature, i) => (
                      <div key={i} className="flex items-start gap-2.5 text-xs text-slate-300">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feature}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Role Portal CTA */}
                <button
                  onClick={() => navigate('/login')}
                  className={`w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs font-semibold text-white bg-gradient-to-r ${card.gradient} hover:opacity-95 shadow-md transition-all group-hover:shadow-lg`}
                >
                  <span>{card.actionText}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── System Features Grid ───────────────────────────── */}
      <section id="features" className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full-Stack Advantages</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
              Engineered to Modernize Campus Operations
            </h2>
            <p className="text-slate-300 text-base">
              Explore the foundational capabilities that make FRAS reliable, tamper-proof, and
              effortless for both faculty and students.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES_LIST.map((feature, idx) => (
              <div
                key={idx}
                className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6 hover:border-slate-700 hover:bg-slate-900/90 transition-all duration-200 group text-left"
              >
                <div className="w-11 h-11 rounded-2xl bg-slate-800 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-base font-bold text-white mb-2">{feature.title}</h3>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Bottom Call to Action (CTA) ─────────────────────── */}
      <section className="relative z-10 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="relative rounded-3xl bg-gradient-to-tr from-primary-950 via-slate-900 to-sky-950 border border-primary-500/30 p-8 sm:p-14 overflow-hidden text-center shadow-2xl">
            {/* Ambient radiant background */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary-600/15 rounded-full blur-3xl pointer-events-none" />

            <div className="relative z-10 max-w-2xl mx-auto">
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-primary-600 to-sky-500 shadow-xl mb-6 border border-white/10">
                <ScanLine className="w-7 h-7 text-white" />
              </div>

              <h2 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white mb-4">
                Ready to Experience Seamless Attendance?
              </h2>

              <p className="text-slate-300 text-sm sm:text-base leading-relaxed mb-8">
                Say goodbye to roll-call delays and proxy cheating. Step into the next generation of
                frictionless, AI-powered biometric attendance today.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <button
                  onClick={handleGetStarted}
                  className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-xl text-sm font-semibold bg-gradient-to-r from-primary-500 to-sky-500 hover:from-primary-400 hover:to-sky-400 text-white shadow-xl shadow-primary-500/30 transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] group"
                >
                  <span>{isAuthenticated ? 'Open Dashboard' : 'Get Started Now'}</span>
                  <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </button>

                <button
                  onClick={() => navigate('/login')}
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl text-sm font-medium text-slate-300 hover:text-white bg-slate-900/80 hover:bg-slate-800 border border-slate-700/80 transition-all duration-150"
                >
                  Sign In with Existing Credentials
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────── */}
      <footer className="relative z-10 border-t border-slate-800/80 bg-slate-950 py-12 text-slate-400 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            {/* Brand in footer */}
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-primary-600 to-sky-500 flex items-center justify-center shadow-md">
                <ScanLine className="w-4 h-4 text-white" />
              </div>
              <div>
                <span className="font-bold text-white text-sm">FRAS</span>
                <span className="text-slate-400 ml-2">
                  Face Recognition Attendance System
                </span>
              </div>
            </div>

            {/* Quick links */}
            <div className="flex flex-wrap items-center justify-center gap-6 text-slate-400">
              <button
                onClick={() => scrollToSection('hero')}
                className="hover:text-slate-200 transition-colors"
              >
                Overview
              </button>
              <button
                onClick={() => scrollToSection('workflow')}
                className="hover:text-slate-200 transition-colors"
              >
                Workflow
              </button>
              <button
                onClick={() => scrollToSection('roles')}
                className="hover:text-slate-200 transition-colors"
              >
                Roles
              </button>
              <button
                onClick={() => scrollToSection('stats')}
                className="hover:text-slate-200 transition-colors"
              >
                Metrics
              </button>
              <button
                onClick={() => navigate('/login')}
                className="hover:text-slate-200 transition-colors"
              >
                Portal Login
              </button>
            </div>

            {/* Status indicator */}
            <div className="flex items-center gap-2 text-slate-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>All Systems Operational</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-slate-900 flex flex-col sm:flex-row items-center justify-between gap-4 text-slate-400 text-[11px]">
            <p>© {new Date().getFullYear()} FRAS. All rights reserved.</p>
            <p className="text-slate-400">
              Powered by Advanced Computer Vision & Euclidean Neural Embeddings
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
