"use strict";(self.webpackChunk_N_E=self.webpackChunk_N_E||[]).push([[752],{2752:function(e,t,a){a.r(t),a.d(t,{Sidebar:function(){return Z}});var r=a(6591),n=a(3330),d=a(2782),i=a(9205),l=a(9433);/**
 * @license lucide-react v0.312.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let c=(0,l.Z)("Package",[["path",{d:"m7.5 4.27 9 5.15",key:"1c824w"}],["path",{d:"M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z",key:"hh9hay"}],["path",{d:"m3.3 7 8.7 5 8.7-5",key:"g66t2b"}],["path",{d:"M12 22V12",key:"d0xqtd"}]]);var h=a(5288),o=a(4767),s=a(4562);/**
 * @license lucide-react v0.312.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let y=(0,l.Z)("Radar",[["path",{d:"M19.07 4.93A10 10 0 0 0 6.99 3.34",key:"z3du51"}],["path",{d:"M4 6h.01",key:"oypzma"}],["path",{d:"M2.29 9.62A10 10 0 1 0 21.31 8.35",key:"qzzz0"}],["path",{d:"M16.24 7.76A6 6 0 1 0 8.23 16.67",key:"1yjesh"}],["path",{d:"M12 18h.01",key:"mhygvu"}],["path",{d:"M17.99 11.66A6 6 0 0 1 15.77 16.67",key:"1u2y91"}],["circle",{cx:"12",cy:"12",r:"2",key:"1c9p78"}],["path",{d:"m13.41 10.59 5.66-5.66",key:"mhq4k0"}]]),p=(0,l.Z)("Trophy",[["path",{d:"M6 9H4.5a2.5 2.5 0 0 1 0-5H6",key:"17hqa7"}],["path",{d:"M18 9h1.5a2.5 2.5 0 0 0 0-5H18",key:"lmptdp"}],["path",{d:"M4 22h16",key:"57wxv0"}],["path",{d:"M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22",key:"1nw9bq"}],["path",{d:"M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22",key:"1np0yb"}],["path",{d:"M18 2H6v7a6 6 0 0 0 12 0V2Z",key:"u46fv3"}]]);var u=a(1816),m=a(6756),k=a(5607),x=a(8384),f=a(6346),v=a(8390);/**
 * @license lucide-react v0.312.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let b=(0,l.Z)("Workflow",[["rect",{width:"8",height:"8",x:"3",y:"3",rx:"2",key:"by2w9f"}],["path",{d:"M7 11v4a2 2 0 0 0 2 2h4",key:"xkn7yn"}],["rect",{width:"8",height:"8",x:"13",y:"13",rx:"2",key:"1cgmvn"}]]);var g=a(2238);let M=[{title:"Operate",items:[{to:"/",label:"Domains",icon:i.Z},{to:"/products",label:"Products",icon:c},{to:"/review",label:"Review queue",icon:h.Z},{to:"/publish",label:"Publish center",icon:o.Z},{to:"/history",label:"Run history",icon:s.Z}]},{title:"Intelligence",items:[{to:"/trends",label:"Trend radar",icon:y},{to:"/winners",label:"Winner patterns",icon:p},{to:"/graveyard",label:"Graveyard",icon:u.Z}]},{title:"Manage",items:[{to:"/manager/domains",label:"Domains & categories",icon:i.Z},{to:"/manager/platforms",label:"Platforms",icon:m.Z},{to:"/manager/social",label:"Social channels",icon:k.Z},{to:"/manager/prompts",label:"Prompts",icon:x.Z},{to:"/manager/ai",label:"AI models",icon:f.Z},{to:"/settings",label:"Settings",icon:v.Z}]}];function Z(){let e=(0,d.usePathname)()||"/";return(0,r.jsxs)("aside",{className:"hidden md:flex w-60 flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground",children:[(0,r.jsx)("div",{className:"px-5 py-5 border-b border-sidebar-border",children:(0,r.jsxs)(n.default,{href:"/",className:"flex items-center gap-2",children:[(0,r.jsx)("div",{className:"h-8 w-8 rounded-lg bg-gradient-primary shadow-glow flex items-center justify-center",children:(0,r.jsx)(b,{className:"h-4 w-4 text-primary-foreground"})}),(0,r.jsxs)("div",{children:[(0,r.jsx)("div",{className:"font-bold tracking-tight text-base",children:"NEXUS"}),(0,r.jsx)("div",{className:"text-[10px] uppercase tracking-[0.16em] text-muted-foreground",children:"Personal AI Engine"})]})]})}),(0,r.jsx)("nav",{className:"flex-1 overflow-y-auto px-2 py-4 space-y-6",children:M.map(t=>(0,r.jsxs)("div",{children:[(0,r.jsx)("div",{className:"px-3 mb-1 text-[10px] font-semibold uppercase tracking-[0.14em] text-muted-foreground",children:t.title}),(0,r.jsx)("ul",{className:"space-y-0.5",children:t.items.map(t=>{let a=e===t.to||"/"!==t.to&&e.startsWith(t.to),d=t.icon;return(0,r.jsx)("li",{children:(0,r.jsxs)(n.default,{href:t.to,className:(0,g.cn)("flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",a?"bg-sidebar-accent text-foreground font-medium":"text-muted-foreground hover:text-foreground hover:bg-sidebar-accent/60"),children:[(0,r.jsx)(d,{className:"h-3.5 w-3.5"}),t.label]})},t.to)})})]},t.title))}),(0,r.jsx)("div",{className:"px-4 py-3 border-t border-sidebar-border text-[11px] text-muted-foreground",children:"v4.0 \xb7 CF $5 plan"})]})}},2238:function(e,t,a){a.d(t,{cn:function(){return d}});var r=a(5959),n=a(3872);function d(){for(var e=arguments.length,t=Array(e),a=0;a<e;a++)t[a]=arguments[a];return(0,n.m6)((0,r.W)(t))}},6346:function(e,t,a){a.d(t,{Z:function(){return r}});/**
 * @license lucide-react v0.312.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,a(9433).Z)("Cpu",[["rect",{x:"4",y:"4",width:"16",height:"16",rx:"2",key:"1vbyd7"}],["rect",{x:"9",y:"9",width:"6",height:"6",key:"o3kz5p"}],["path",{d:"M15 2v2",key:"13l42r"}],["path",{d:"M15 20v2",key:"15mkzm"}],["path",{d:"M2 15h2",key:"1gxd5l"}],["path",{d:"M2 9h2",key:"1bbxkp"}],["path",{d:"M20 15h2",key:"19e6y8"}],["path",{d:"M20 9h2",key:"19tzq7"}],["path",{d:"M9 2v2",key:"165o2o"}],["path",{d:"M9 20v2",key:"i2bqo8"}]])},8384:function(e,t,a){a.d(t,{Z:function(){return r}});/**
 * @license lucide-react v0.312.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,a(9433).Z)("FileCode",[["path",{d:"M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z",key:"1rqfz7"}],["path",{d:"M14 2v4a2 2 0 0 0 2 2h4",key:"tnqrlb"}],["path",{d:"m10 13-2 2 2 2",key:"17smn8"}],["path",{d:"m14 17 2-2-2-2",key:"14mezr"}]])},6756:function(e,t,a){a.d(t,{Z:function(){return r}});/**
 * @license lucide-react v0.312.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,a(9433).Z)("Globe2",[["path",{d:"M21.54 15H17a2 2 0 0 0-2 2v4.54",key:"1djwo0"}],["path",{d:"M7 3.34V5a3 3 0 0 0 3 3v0a2 2 0 0 1 2 2v0c0 1.1.9 2 2 2v0a2 2 0 0 0 2-2v0c0-1.1.9-2 2-2h3.17",key:"1fi5u6"}],["path",{d:"M11 21.95V18a2 2 0 0 0-2-2v0a2 2 0 0 1-2-2v-1a2 2 0 0 0-2-2H2.05",key:"xsiumc"}],["circle",{cx:"12",cy:"12",r:"10",key:"1mglay"}]])},4562:function(e,t,a){a.d(t,{Z:function(){return r}});/**
 * @license lucide-react v0.312.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,a(9433).Z)("History",[["path",{d:"M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8",key:"1357e3"}],["path",{d:"M3 3v5h5",key:"1xhq8a"}],["path",{d:"M12 7v5l4 2",key:"1fdv2h"}]])},9205:function(e,t,a){a.d(t,{Z:function(){return r}});/**
 * @license lucide-react v0.312.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,a(9433).Z)("LayoutGrid",[["rect",{width:"7",height:"7",x:"3",y:"3",rx:"1",key:"1g98yp"}],["rect",{width:"7",height:"7",x:"14",y:"3",rx:"1",key:"6d4xhi"}],["rect",{width:"7",height:"7",x:"14",y:"14",rx:"1",key:"nxv5o0"}],["rect",{width:"7",height:"7",x:"3",y:"14",rx:"1",key:"1bb6yr"}]])},5607:function(e,t,a){a.d(t,{Z:function(){return r}});/**
 * @license lucide-react v0.312.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,a(9433).Z)("Megaphone",[["path",{d:"m3 11 18-5v12L3 14v-3z",key:"n962bs"}],["path",{d:"M11.6 16.8a3 3 0 1 1-5.8-1.6",key:"1yl0tm"}]])},4767:function(e,t,a){a.d(t,{Z:function(){return r}});/**
 * @license lucide-react v0.312.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,a(9433).Z)("Send",[["path",{d:"m22 2-7 20-4-9-9-4Z",key:"1q3vgg"}],["path",{d:"M22 2 11 13",key:"nzbqef"}]])},8390:function(e,t,a){a.d(t,{Z:function(){return r}});/**
 * @license lucide-react v0.312.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,a(9433).Z)("Settings",[["path",{d:"M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z",key:"1qme2f"}],["circle",{cx:"12",cy:"12",r:"3",key:"1v7zrd"}]])},5288:function(e,t,a){a.d(t,{Z:function(){return r}});/**
 * @license lucide-react v0.312.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,a(9433).Z)("ShieldCheck",[["path",{d:"M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10",key:"1irkt0"}],["path",{d:"m9 12 2 2 4-4",key:"dzmm74"}]])},1816:function(e,t,a){a.d(t,{Z:function(){return r}});/**
 * @license lucide-react v0.312.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */let r=(0,a(9433).Z)("Skull",[["circle",{cx:"9",cy:"12",r:"1",key:"1vctgf"}],["circle",{cx:"15",cy:"12",r:"1",key:"1tmaij"}],["path",{d:"M8 20v2h8v-2",key:"ded4og"}],["path",{d:"m12.5 17-.5-1-.5 1h1z",key:"3me087"}],["path",{d:"M16 20a2 2 0 0 0 1.56-3.25 8 8 0 1 0-11.12 0A2 2 0 0 0 8 20",key:"xq9p5u"}]])}}]);