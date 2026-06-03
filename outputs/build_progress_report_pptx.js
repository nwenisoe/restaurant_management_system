const pptxgen = require("pptxgenjs");

const pptx = new pptxgen();
pptx.layout = "LAYOUT_WIDE";
pptx.author = "Restaurant Management System Capstone";
pptx.subject = "Capstone Project Progress Report";
pptx.title = "Restaurant Management System Progress Report";
pptx.company = "[University Name]";
pptx.lang = "en-US";
pptx.theme = {
  headFontFace: "Aptos Display",
  bodyFontFace: "Aptos",
  lang: "en-US",
};
pptx.defineLayout({ name: "LAYOUT_WIDE", width: 13.333, height: 7.5 });

const C = {
  ink: "0F172A",
  slate: "475569",
  muted: "64748B",
  line: "D9E2EC",
  pale: "F8FAFC",
  band: "EEF2F7",
  teal: "0F766E",
  teal2: "14B8A6",
  amber: "B45309",
  red: "B91C1C",
  green: "15803D",
  blue: "2563EB",
  white: "FFFFFF",
};

function slideTitle(slide, kicker, title, subtitle) {
  slide.addText(kicker, {
    x: 0.65, y: 0.34, w: 5.3, h: 0.22, fontSize: 8.5, bold: true,
    color: C.teal, charSpace: 1.1, breakLine: false,
  });
  slide.addText(title, {
    x: 0.65, y: 0.62, w: 10.5, h: 0.42, fontSize: 21, bold: true,
    color: C.ink, margin: 0,
  });
  if (subtitle) {
    slide.addText(subtitle, {
      x: 0.65, y: 1.08, w: 11.1, h: 0.34, fontSize: 10.5,
      color: C.muted, margin: 0,
    });
  }
  slide.addShape(pptx.ShapeType.line, {
    x: 0.65, y: 1.5, w: 12.05, h: 0,
    line: { color: C.line, width: 1 },
  });
}

function footer(slide, n) {
  slide.addText("Restaurant Management System | Capstone Progress Report", {
    x: 0.65, y: 7.12, w: 7.8, h: 0.18, fontSize: 7.5, color: "94A3B8", margin: 0,
  });
  slide.addText(String(n).padStart(2, "0"), {
    x: 12.15, y: 7.08, w: 0.55, h: 0.24, fontSize: 8.5, bold: true,
    color: C.muted, align: "right", margin: 0,
  });
}

function card(slide, x, y, w, h, title, body, opts = {}) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h,
    rectRadius: 0.08,
    fill: { color: opts.fill || C.white },
    line: { color: opts.line || C.line, width: 0.8 },
  });
  if (opts.accent) {
    slide.addShape(pptx.ShapeType.rect, {
      x, y, w: 0.08, h,
      fill: { color: opts.accent },
      line: { color: opts.accent },
    });
  }
  slide.addText(title, {
    x: x + 0.22, y: y + 0.18, w: w - 0.44, h: 0.25,
    fontSize: 10.5, bold: true, color: opts.titleColor || C.ink, margin: 0.02,
  });
  slide.addText(body, {
    x: x + 0.22, y: y + 0.52, w: w - 0.44, h: h - 0.66,
    fontSize: opts.bodySize || 8.6, color: opts.bodyColor || C.slate,
    fit: "shrink", breakLine: false, valign: "top",
    margin: 0.02, paraSpaceAfterPt: 3,
  });
}

function bullets(slide, items, x, y, w, h, opts = {}) {
  const rich = [];
  items.forEach((text, i) => {
    rich.push({
      text: `${opts.marker || "•"} ${text}${i === items.length - 1 ? "" : "\n"}`,
      options: { bullet: false },
    });
  });
  slide.addText(rich, {
    x, y, w, h, fontSize: opts.size || 10, color: opts.color || C.slate,
    margin: 0.02, fit: "shrink", breakLine: false, paraSpaceAfterPt: 3,
  });
}

function pill(slide, x, y, text, color = C.teal, w = 1.15) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h: 0.3, rectRadius: 0.08,
    fill: { color }, line: { color },
  });
  slide.addText(text, {
    x, y: y + 0.075, w, h: 0.1, fontSize: 7.5,
    color: C.white, bold: true, align: "center", margin: 0,
  });
}

function mockBrowser(slide, x, y, w, h, title, labels) {
  slide.addShape(pptx.ShapeType.roundRect, {
    x, y, w, h, rectRadius: 0.09,
    fill: { color: C.white }, line: { color: C.line, width: 0.9 },
  });
  slide.addShape(pptx.ShapeType.rect, {
    x, y, w, h: 0.34,
    fill: { color: C.band }, line: { color: C.band },
  });
  slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.16, y: y + 0.12, w: 0.08, h: 0.08, fill: { color: "EF4444" }, line: { color: "EF4444" } });
  slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.31, y: y + 0.12, w: 0.08, h: 0.08, fill: { color: "F59E0B" }, line: { color: "F59E0B" } });
  slide.addShape(pptx.ShapeType.ellipse, { x: x + 0.46, y: y + 0.12, w: 0.08, h: 0.08, fill: { color: "22C55E" }, line: { color: "22C55E" } });
  slide.addText(title, { x: x + 0.18, y: y + 0.52, w: w - 0.36, h: 0.24, fontSize: 10, bold: true, color: C.ink, margin: 0 });
  labels.forEach((label, i) => {
    const yy = y + 0.92 + i * 0.38;
    slide.addShape(pptx.ShapeType.roundRect, {
      x: x + 0.18, y: yy, w: w - 0.36, h: 0.24, rectRadius: 0.05,
      fill: { color: i % 2 === 0 ? "F8FAFC" : "ECFDF5" },
      line: { color: i % 2 === 0 ? "E2E8F0" : "BBF7D0" },
    });
    slide.addText(label, { x: x + 0.34, y: yy + 0.055, w: w - 0.68, h: 0.1, fontSize: 7.2, color: C.slate, margin: 0 });
  });
}

// 1
{
  const s = pptx.addSlide();
  s.background = { color: C.pale };
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 13.333, h: 7.5, fill: { color: C.pale }, line: { color: C.pale } });
  s.addShape(pptx.ShapeType.rect, { x: 0, y: 0, w: 0.23, h: 7.5, fill: { color: C.teal }, line: { color: C.teal } });
  s.addText("CAPSTONE PROJECT PROGRESS REPORT", { x: 0.75, y: 0.78, w: 5.5, h: 0.24, fontSize: 9, bold: true, color: C.teal, charSpace: 1.1, margin: 0 });
  s.addText("Restaurant Management System", { x: 0.75, y: 1.25, w: 10.4, h: 0.72, fontSize: 31, bold: true, color: C.ink, margin: 0 });
  s.addText("A web-based system for menu, food, table, order, invoice, and sales report management.", { x: 0.78, y: 2.14, w: 7.8, h: 0.52, fontSize: 14, color: C.slate, margin: 0 });
  card(s, 0.78, 3.25, 4.0, 1.55, "Student / Supervisor", "Student Name: [Student Name]\nSupervisor: [Supervisor Name]\nClass: [Class / Section]", { fill: C.white });
  card(s, 5.05, 3.25, 4.0, 1.55, "Institution", "University: [University Name]\nDepartment: [Department Name]\nDate: 3 June 2026", { fill: C.white });
  card(s, 9.32, 3.25, 2.8, 1.55, "Current Status", "Prototype implemented\nUI refined\nTests passing", { fill: "ECFDF5", accent: C.teal });
  footer(s, 1);
}

// 2
{
  const s = pptx.addSlide();
  slideTitle(s, "PROJECT CONTEXT", "Problem Statement", "Restaurant operations become error-prone when records are manual or disconnected.");
  card(s, 0.75, 1.85, 3.75, 3.95, "Operational Pain Points", "• Manual menu and food updates\n• Hard-to-track table/order records\n• Invoice totals can be miscalculated\n• Reports require repeated manual work\n• Demo data can become stale over time", { accent: C.red });
  card(s, 4.8, 1.85, 3.75, 3.95, "Business Impact", "Slow service, duplicated records, inconsistent invoices, weak daily sales visibility, and lower confidence during restaurant review or capstone demonstration.", { accent: C.amber });
  card(s, 8.85, 1.85, 3.75, 3.95, "Project Response", "Build one integrated web application that connects menus, foods, tables, orders, order items, invoices, and sales reports through a consistent workflow.", { accent: C.teal });
  footer(s, 2);
}

// 3
{
  const s = pptx.addSlide();
  slideTitle(s, "PROJECT DEFINITION", "Objectives and Scope", "The project focuses on a practical restaurant administration workflow, not full POS hardware.");
  card(s, 0.72, 1.86, 5.65, 4.45, "Core Objectives", "• Manage menus and food catalog with images\n• Manage restaurant tables and capacities\n• Place food orders through a cart flow\n• Generate order items and invoices automatically\n• Track invoice payment status and invoice date\n• Provide dashboard, daily sales, and summary reports\n• Support demo reset data for presentation", { accent: C.teal });
  card(s, 6.75, 1.86, 2.75, 4.45, "In Scope", "Web app\nREST API\nMongoDB data\nAuthentication\nInvoice flow\nReports\nDemo data", { fill: "F8FAFC", accent: C.green });
  card(s, 9.85, 1.86, 2.75, 4.45, "Out of Scope", "POS hardware\nReal payment gateway\nKitchen display\nInventory forecasting\nProduction hosting\nMobile app", { fill: "FFF7ED", accent: C.amber });
  footer(s, 3);
}

// 4
{
  const s = pptx.addSlide();
  slideTitle(s, "EXECUTION APPROACH", "Methodology", "Iterative full-stack development: model, API, UI, integration, test, review, refine.");
  const steps = [
    ["1", "Model Data", "MongoDB collections for menu, food, table, order, orderItem, invoice, sales_report"],
    ["2", "Build API", "Go/Gin controllers and REST routes with validation and canonical invoice endpoints"],
    ["3", "Build UI", "React pages for dashboard, catalog, order food, orders, invoices, and reports"],
    ["4", "Integrate", "Axios client links frontend actions to backend workflow"],
    ["5", "Verify", "Run Go tests, Vite build, and demo reset script checks"],
  ];
  steps.forEach((st, i) => {
    const x = 0.78 + i * 2.48;
    s.addShape(pptx.ShapeType.ellipse, { x, y: 2.0, w: 0.52, h: 0.52, fill: { color: C.teal }, line: { color: C.teal } });
    s.addText(st[0], { x, y: 2.16, w: 0.52, h: 0.13, fontSize: 9, color: C.white, bold: true, align: "center", margin: 0 });
    s.addText(st[1], { x: x - 0.28, y: 2.78, w: 1.3, h: 0.22, fontSize: 10.5, bold: true, color: C.ink, align: "center", margin: 0 });
    s.addText(st[2], { x: x - 0.55, y: 3.2, w: 1.9, h: 1.35, fontSize: 7.8, color: C.slate, align: "center", margin: 0.02, fit: "shrink" });
    if (i < steps.length - 1) {
      s.addShape(pptx.ShapeType.line, { x: x + 0.62, y: 2.26, w: 1.25, h: 0, line: { color: C.line, width: 1.5, beginArrowType: "none", endArrowType: "triangle" } });
    }
  });
  card(s, 0.9, 5.25, 11.55, 0.85, "Quality Loop", "Architect review identified workflow confusion, duplicate invoice endpoints, stale demo data, and weak filtering. Fixes were implemented and verified after each review pass.", { fill: "ECFDF5", accent: C.teal, bodySize: 9 });
  footer(s, 4);
}

// 5
{
  const s = pptx.addSlide();
  slideTitle(s, "TECH STACK", "Tools and Technologies", "The system uses a Go backend, React frontend, MongoDB database, and supporting build/test tools.");
  const cols = [
    ["Backend", "Go\nGin framework\nJWT\nZap logger\nValidation helpers"],
    ["Frontend", "React\nVite\nTailwind CSS\nAxios\nLucide icons\nRecharts"],
    ["Database", "MongoDB\nDocument collections\nDemo reset script\nDocker compose support"],
    ["Verification", "go test ./...\nnpm run build\nManual UI review\nREADME change log"],
  ];
  cols.forEach((c, i) => card(s, 0.75 + i * 3.05, 1.92, 2.72, 3.75, c[0], c[1], { fill: i % 2 ? C.white : C.pale, accent: [C.teal, C.blue, C.green, C.amber][i], bodySize: 10 }));
  footer(s, 5);
}

// 6
{
  const s = pptx.addSlide();
  slideTitle(s, "SYSTEM DESIGN", "Architecture and Data Flow", "The Order Food flow is now the single primary path for creating orders and invoices.");
  const boxes = [
    [0.75, "React UI", "Dashboard\nOrder Food\nOrders\nInvoices\nReports"],
    [3.55, "Axios Client", "HTTP requests\nAuth token\nError handling"],
    [6.35, "Go / Gin API", "Routes\nControllers\nValidation\nBusiness rules"],
    [9.15, "MongoDB", "menu\nfood\ntable\norder\norderItem\ninvoice\nsales_report"],
  ];
  boxes.forEach((b, i) => {
    card(s, b[0], 2.0, 2.25, 2.95, b[1], b[2], { fill: C.white, accent: [C.blue, C.teal, C.amber, C.green][i], bodySize: 9.2 });
    if (i < boxes.length - 1) {
      s.addShape(pptx.ShapeType.line, { x: b[0] + 2.35, y: 3.45, w: 0.65, h: 0, line: { color: C.slate, width: 1.4, endArrowType: "triangle" } });
    }
  });
  card(s, 0.85, 5.45, 11.7, 0.75, "Key Architecture Fix", "Removed duplicate public invoice routes and standardized the frontend on `/api/v1/invoices` for list, patch, and delete operations.", { fill: "F8FAFC", accent: C.teal, bodySize: 8.8 });
  footer(s, 6);
}

// 7
{
  const s = pptx.addSlide();
  slideTitle(s, "PROGRESS", "Completed, In Progress, Remaining", "Most core implementation work is complete; remaining work focuses on polish, documentation, and final demo readiness.");
  card(s, 0.72, 1.8, 3.85, 4.85, "Completed", "• Authentication and protected routes\n• CRUD pages for menus, foods, tables\n• Food ordering cart workflow\n• Order item and invoice generation\n• Invoice edit/delete/status update\n• Order and invoice date filters\n• Related invoice view from order card\n• Demo reset script\n• README progress notes\n• PPTX and paper draft", { accent: C.green, bodySize: 8.25 });
  card(s, 4.78, 1.8, 3.85, 4.85, "In Progress", "• Final UI screenshot collection\n• Final capstone paper polishing\n• Presenter rehearsal material\n• More demo validation after MongoDB starts\n• Final review of wording and references", { accent: C.amber, bodySize: 8.8 });
  card(s, 8.84, 1.8, 3.85, 4.85, "Remaining", "• Run reset script with MongoDB running\n• Capture final UI screenshots\n• Add more backend/frontend tests\n• Prepare deployment/demo environment\n• Submit final paper and presentation\n• Rehearse final presentation", { accent: C.blue, bodySize: 8.8 });
  footer(s, 7);
}

// 8
{
  const s = pptx.addSlide();
  slideTitle(s, "CURRENT RESULTS", "Prototype Evidence and Test Outputs", "Live screenshots were not captured because localhost:5173 was not reachable during deck preparation.");
  mockBrowser(s, 0.72, 1.82, 3.85, 2.35, "Dashboard Prototype", ["Metrics: menus, foods, tables", "Today sales and invoices", "Best sellers panel"]);
  mockBrowser(s, 4.74, 1.82, 3.85, 2.35, "Order Food Prototype", ["Menu tabs and food images", "Cart and table selection", "Invoice generated after checkout"]);
  mockBrowser(s, 8.76, 1.82, 3.85, 2.35, "Invoices Prototype", ["Date filter and search", "Related invoice filter", "Payment status update"]);
  card(s, 0.72, 4.65, 5.9, 1.2, "Test Output Summary", "`go test ./...` passes across backend packages.\n`npm run build` passes for the Vite frontend bundle.", { fill: "ECFDF5", accent: C.green, bodySize: 10 });
  card(s, 6.9, 4.65, 5.7, 1.2, "Demo Data Status", "`scripts/reset_demo/main.go` clears old demo records and inserts fresh menus, foods, tables, orders, invoices, and a sales report. MongoDB must be running before execution.", { fill: "F8FAFC", accent: C.teal, bodySize: 8.9 });
  footer(s, 8);
}

// 9
{
  const s = pptx.addSlide();
  slideTitle(s, "RISKS AND FIXES", "Challenges and Solutions", "Recent architect reviews focused on workflow clarity and data consistency.");
  const rows = [
    ["Frontend/backend invoice mismatch", "Standardized all invoice calls on `/api/v1/invoices`"],
    ["Manual New Order confused users", "Redirected manual order routes to Order Food and removed visible links"],
    ["Order card showed unrelated invoices", "Added `?orderId=` related invoice filter"],
    ["Old records polluted demos", "Added reset script to clear and insert fresh demo data"],
    ["Noisy debug logs", "Removed request/response and success debug logs"],
    ["MongoDB local/Docker differences", "Documented local URI and Docker dependency"],
  ];
  const table = s.addTable([
    [{ text: "Challenge", options: { bold: true } }, { text: "Solution / Plan", options: { bold: true } }],
    ...rows,
  ], {
    x: 0.82, y: 1.86, w: 11.7, h: 4.55,
    border: { type: "solid", color: C.line, pt: 0.75 },
    fill: { color: C.white },
    color: C.slate,
    fontFace: "Aptos",
    fontSize: 8.7,
    valign: "mid",
    margin: 0.08,
    autoFit: false,
    colW: [4.45, 7.25],
    rowH: 0.52,
  });
  footer(s, 9);
}

// 10
{
  const s = pptx.addSlide();
  slideTitle(s, "NEXT STEPS", "Future Work and Timeline", "The remaining plan moves from prototype polish to final capstone submission.");
  const timeline = [
    ["Week 1", "Finalize UI", "Capture screenshots, run reset data, verify demo flow"],
    ["Week 2", "Testing", "Add focused API/UI tests and repeat build verification"],
    ["Week 3", "Reports", "Improve report exports and prepare final demo data"],
    ["Week 4", "Submission", "Finalize paper, presentation, deployment notes, and rehearsal"],
  ];
  timeline.forEach((t, i) => {
    const x = 0.8 + i * 3.03;
    card(s, x, 1.82, 2.65, 2.25, t[0], `${t[1]}\n${t[2]}`, { fill: i % 2 ? C.white : C.pale, accent: [C.teal, C.blue, C.amber, C.green][i], bodySize: 8.3 });
  });
  card(s, 0.82, 4.62, 11.65, 1.18, "References", "[1] Project README and source code. [2] Go documentation. [3] Gin framework documentation. [4] React documentation. [5] MongoDB documentation. [6] Tailwind CSS documentation. [7] Vite documentation.", { fill: "F8FAFC", accent: C.slate, bodySize: 8.2 });
  card(s, 0.82, 6.02, 11.65, 0.42, "Submission Note", "This presentation is editable and uses placeholder identity fields where university/student details were not provided.", { fill: "ECFDF5", accent: C.teal, bodySize: 8.4 });
  footer(s, 10);
}

pptx.writeFile({ fileName: "restaurant-management-progress-report.pptx" });
