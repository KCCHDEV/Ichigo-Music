import React from 'react';
import { Sparkles, Globe, MessageSquare, ExternalLink, Code2, Cpu, Music2, Wand2, Mic2, ShieldCheck, Share2 } from 'lucide-react';

interface AboutViewProps {
  openSettings?: () => void;
}

export const AboutView: React.FC<AboutViewProps> = () => {
  const openExternalLink = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const socialLinks = [
    {
      name: 'Facebook',
      url: 'https://facebook.com',
      icon: Share2,
      color: 'bg-blue-600/20 text-blue-400 border-blue-500/30 hover:bg-blue-600/30',
      label: 'Nay Golf',
    },
    {
      name: 'GitHub',
      url: 'https://github.com',
      icon: Code2,
      color: 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700',
      label: 'NayGolf Dev',
    },
    {
      name: 'Discord',
      url: 'https://discord.gg',
      icon: MessageSquare,
      color: 'bg-indigo-600/20 text-indigo-400 border-indigo-500/30 hover:bg-indigo-600/30',
      label: 'Join Discord Server',
    },
    {
      name: 'Project Repo',
      url: 'https://github.com/anomalyco/opencode',
      icon: Globe,
      color: 'bg-sky-500/20 text-sky-300 border-sky-500/30 hover:bg-sky-500/30',
      label: 'Ichigo Music Repository',
    },
  ];

  const appFeatures = [
    {
      icon: Cpu,
      title: 'Lavalink Audio Engine',
      description: 'ถอดรหัสและเล่นไฟล์เสียงคุณภาพระดับ High-Fidelity ผ่านระบบเซิร์ฟเวอร์ Lavalink v4',
    },
    {
      icon: Wand2,
      title: 'Auto Mix & Autoplay',
      description: 'ระบบสืบค้นและเตรียมคิวเพลงถัดไปสไตล์ Apple Music เล่นเพลงต่อเนื่องไม่มีสะดุด',
    },
    {
      icon: Mic2,
      title: 'Synced Karaoke Lyrics',
      description: 'แสดงเนื้อเพลงซิงค์เรียลไทม์ (LRC) ตัวหนังสือเรืองแสงสีฟ้า กดเลือกท่อนเพื่อกระโดดข้ามเวลาได้ทันที',
    },
    {
      icon: Music2,
      title: 'Apple Music Fullscreen Player',
      description: 'โหมดเครื่องเล่นแบบเต็มหน้าจอ พร้อมการ์ดขาวคลาสสิกและฉากหลังฉายแสงตามบรรยากาศเพลง',
    },
    {
      icon: Sparkles,
      title: 'Ichigo (Code 015) Theme',
      description: 'ดีไซน์ธีมสีน้ำเงินเข้ม สีกรมท่า แสงไซแอน พร้อมกิ๊บติดผมสีขาวเอกลักษณ์จาก Darling in the Franxx',
    },
    {
      icon: ShieldCheck,
      title: 'History & Smart Search',
      description: 'ระบบค้นหาอัตโนมัติ (Auto-Suggestions) พร้อมบันทึกประวัติการฟังย้อนหลังเฉพาะบุคคล',
    },
  ];

  return (
    <div className="p-6 space-y-10 pb-32 max-w-5xl mx-auto animate-page-enter">
      {/* Creator Profile Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-slate-900 via-slate-950 to-slate-900 border border-slate-800/80 p-8 shadow-2xl">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col md:flex-row items-center gap-8 text-center md:text-left">
          {/* Creator App Icon */}
          <div className="relative shrink-0">
            <img
              src="/app-logo.png"
              alt="Nay Golf - Ichigo Music"
              className="w-32 h-32 rounded-3xl object-cover shadow-2xl border-2 border-sky-500/40 shadow-sky-500/25 group-hover:scale-105 transition duration-300"
            />
            <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-white border-4 border-slate-950 flex items-center justify-center shadow-lg">
              <Sparkles className="w-3.5 h-3.5 text-sky-600" />
            </span>
          </div>

          {/* Profile Details */}
          <div className="space-y-3 flex-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold uppercase tracking-wider">
              <Code2 className="w-3.5 h-3.5 text-white" />
              <span>Developer & Creator</span>
            </div>

            <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
              สร้างโดย <span className="text-sky-400">Nay Golf</span>
            </h1>

            <p className="text-sm text-slate-300 leading-relaxed max-w-xl">
              Ichigo Music แอปฟังเพลง Desktop ความเร็วสูง พัฒนาขึ้นด้วยใจรักในเสียงเพลงและอนิเมะ Darling in the Franxx รวบรวมฟีเจอร์ระดับพรีเมียมจาก Apple Music มาไว้ในแอปเดียว
            </p>

            {/* Social Link Buttons */}
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 pt-2">
              {socialLinks.map((link, idx) => {
                const IconComponent = link.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => openExternalLink(link.url)}
                    className={`px-4 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition active:scale-95 shadow-sm ${link.color}`}
                  >
                    <IconComponent className="w-4 h-4" />
                    <span>{link.name}</span>
                    <ExternalLink className="w-3 h-3 opacity-60 ml-0.5" />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* App Details Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-sky-400" />
              <span>รายละเอียดแอปพลิเคชัน (App Details)</span>
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Ichigo Music (Code 015 Edition) • Version 0.1.0 (Desktop Edition)
            </p>
          </div>
        </div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {appFeatures.map((feat, idx) => {
            const IconComp = feat.icon;
            return (
              <div
                key={idx}
                style={{ animationDelay: `${idx * 60}ms` }}
                className="glass-card-ichigo p-5 rounded-2xl space-y-3 animate-item-enter"
              >
                <div className="w-10 h-10 rounded-xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <IconComp className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-white">{feat.title}</h3>
                <p className="text-xs text-slate-400 leading-relaxed">
                  {feat.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
