from docx import Document
from docx.enum.section import WD_SECTION
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Inches, Pt, RGBColor


OUT = "restaurant-management-project-paper.docx"


def set_cell_shading(cell, fill):
    tc_pr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement("w:shd")
    shd.set(qn("w:fill"), fill)
    tc_pr.append(shd)


def set_cell_margins(cell, top=80, start=120, bottom=80, end=120):
    tc = cell._tc
    tc_pr = tc.get_or_add_tcPr()
    tc_mar = tc_pr.first_child_found_in("w:tcMar")
    if tc_mar is None:
        tc_mar = OxmlElement("w:tcMar")
        tc_pr.append(tc_mar)
    for m, v in {"top": top, "start": start, "bottom": bottom, "end": end}.items():
        node = tc_mar.find(qn(f"w:{m}"))
        if node is None:
            node = OxmlElement(f"w:{m}")
            tc_mar.append(node)
        node.set(qn("w:w"), str(v))
        node.set(qn("w:type"), "dxa")


def set_table_borders(table):
    tbl = table._tbl
    tbl_pr = tbl.tblPr
    borders = tbl_pr.first_child_found_in("w:tblBorders")
    if borders is None:
        borders = OxmlElement("w:tblBorders")
        tbl_pr.append(borders)
    for edge in ("top", "left", "bottom", "right", "insideH", "insideV"):
        tag = f"w:{edge}"
        element = borders.find(qn(tag))
        if element is None:
            element = OxmlElement(tag)
            borders.append(element)
        element.set(qn("w:val"), "single")
        element.set(qn("w:sz"), "4")
        element.set(qn("w:space"), "0")
        element.set(qn("w:color"), "B7C0CC")


def set_repeat_table_header(row):
    tr_pr = row._tr.get_or_add_trPr()
    tbl_header = OxmlElement("w:tblHeader")
    tbl_header.set(qn("w:val"), "true")
    tr_pr.append(tbl_header)


def set_paragraph_font(paragraph, size=10, bold=False, italic=False):
    for run in paragraph.runs:
        run.font.name = "Times New Roman"
        run._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
        run.font.size = Pt(size)
        run.bold = bold
        run.italic = italic


def add_paragraph(doc, text="", style=None, size=10, bold=False, italic=False, align=None):
    p = doc.add_paragraph(style=style)
    if text:
        p.add_run(text)
    set_paragraph_font(p, size=size, bold=bold, italic=italic)
    p.paragraph_format.space_after = Pt(3)
    p.paragraph_format.line_spacing = 1.0
    if align is not None:
        p.alignment = align
    return p


def add_heading(doc, text, level=1):
    p = doc.add_paragraph()
    run = p.add_run(text.upper() if level == 1 else text)
    run.font.name = "Times New Roman"
    run._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
    run.font.size = Pt(10)
    run.bold = True
    p.paragraph_format.space_before = Pt(8)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.line_spacing = 1.0
    return p


def add_bullet(doc, text):
    p = doc.add_paragraph(style="List Bullet")
    p.add_run(text)
    set_paragraph_font(p, size=10)
    p.paragraph_format.space_after = Pt(2)
    p.paragraph_format.left_indent = Inches(0.25)
    return p


def add_numbered_ref(doc, text):
    p = doc.add_paragraph(style="List Number")
    p.add_run(text)
    set_paragraph_font(p, size=8)
    p.paragraph_format.space_after = Pt(1)
    return p


def add_caption(doc, text):
    p = add_paragraph(doc, text, size=8, align=WD_ALIGN_PARAGRAPH.CENTER)
    return p


def add_table(doc, headers, rows, widths):
    table = doc.add_table(rows=1, cols=len(headers))
    table.alignment = WD_ALIGN_PARAGRAPH.CENTER
    table.autofit = False
    set_table_borders(table)
    hdr = table.rows[0]
    set_repeat_table_header(hdr)
    for i, head in enumerate(headers):
        cell = hdr.cells[i]
        cell.text = head
        set_cell_shading(cell, "E8EEF5")
        set_cell_margins(cell)
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        cell.width = widths[i]
        for p in cell.paragraphs:
            p.alignment = WD_ALIGN_PARAGRAPH.CENTER
            set_paragraph_font(p, size=9, bold=True)
    for row in rows:
        cells = table.add_row().cells
        for i, value in enumerate(row):
            cell = cells[i]
            cell.text = value
            set_cell_margins(cell)
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            cell.width = widths[i]
            for p in cell.paragraphs:
                p.alignment = WD_ALIGN_PARAGRAPH.LEFT if i != 0 else WD_ALIGN_PARAGRAPH.CENTER
                set_paragraph_font(p, size=9)
    doc.add_paragraph()
    return table


def configure_styles(doc):
    styles = doc.styles
    for name in ["Normal", "List Bullet", "List Number"]:
        style = styles[name]
        style.font.name = "Times New Roman"
        style._element.rPr.rFonts.set(qn("w:eastAsia"), "Times New Roman")
        style.font.size = Pt(10)
        style.paragraph_format.line_spacing = 1.0
        style.paragraph_format.space_after = Pt(3)


def build():
    doc = Document()
    section = doc.sections[0]
    section.page_width = Cm(21)
    section.page_height = Cm(29.7)
    section.top_margin = Cm(2.54)
    section.bottom_margin = Cm(2.54)
    section.left_margin = Cm(2.54)
    section.right_margin = Cm(2.54)
    configure_styles(doc)

    title = add_paragraph(doc, "Restaurant Management System", size=12, bold=True, align=WD_ALIGN_PARAGRAPH.CENTER)
    title.paragraph_format.space_after = Pt(8)
    for line in [
        "line 1: [Student Name]",
        "line 2: Department of [Specialized Major]",
        "(of Affiliation)",
        "line 3: [University Name]",
        "(of Affiliation)",
        "line 4: [email address]",
    ]:
        add_paragraph(doc, line, size=10, align=WD_ALIGN_PARAGRAPH.CENTER)

    add_heading(doc, "Abstract", 2)
    abstract = (
        "This project presents a web-based Restaurant Management System designed to improve daily restaurant operations "
        "by replacing manual menu, food, table, order, invoice, and sales reporting processes with an integrated digital "
        "workflow. The system supports authentication, menu and food catalog management, table management, food ordering, "
        "automatic order item creation, invoice generation, payment status tracking, and sales report review. The backend "
        "is implemented using Go, the Gin web framework, MongoDB, JWT authentication, and structured logging. The frontend "
        "is built with React, Vite, Tailwind CSS, Axios, Lucide icons, and chart components for reporting. The project "
        "uses an iterative full-stack methodology in which database models, REST APIs, frontend pages, integration flows, "
        "and demo data are developed and tested incrementally. Current results show that the system can manage demo menus, "
        "foods with images, tables, customer orders, invoices, and daily sales summaries. The completed prototype provides "
        "a practical foundation for a restaurant administration system while leaving future work for deployment, role-based "
        "authorization, advanced analytics, and payment integration."
    )
    add_paragraph(doc, abstract, size=9, italic=True)
    add_paragraph(
        doc,
        "Keywords-restaurant management system; web application; Go; React; MongoDB; invoice management",
        size=9,
        italic=True,
    )

    add_heading(doc, "Introduction")
    add_paragraph(
        doc,
        "Restaurants handle many repeated operational tasks every day, including maintaining menus, recording food items, "
        "assigning tables, taking customer orders, preparing invoices, and checking sales performance. When these activities "
        "are handled manually, staff may face duplicate records, calculation mistakes, missing invoice information, and slow "
        "report preparation. A digital management system can reduce these problems by keeping related records in one place "
        "and by connecting the order process directly with invoice and report generation.",
    )
    add_paragraph(
        doc,
        "The purpose of this capstone project is to design and implement a simple but functional Restaurant Management System "
        "for restaurant staff and administrators. The system emphasizes the core business workflow: create menu and food data, "
        "select foods for a customer, assign a table, generate the order and invoice, and review sales information.",
    )

    add_heading(doc, "Literature Survey")
    add_paragraph(
        doc,
        "Restaurant information systems and point-of-sale applications commonly aim to improve order accuracy, speed of "
        "service, inventory visibility, and sales monitoring. Modern web systems often separate the presentation layer from "
        "the server-side application layer using REST APIs. This separation allows a frontend client to evolve independently "
        "while backend services protect data consistency and validation. In this project, React is used for interactive user "
        "interfaces, while Go and Gin provide lightweight API routing and request handling.",
    )
    add_paragraph(
        doc,
        "MongoDB is selected because restaurant data such as invoices and order items can be represented naturally as document "
        "structures. For example, each invoice can store payment information and a list of purchased food items. JSON-based API "
        "communication also maps well to MongoDB documents. Authentication is supported through JWT so protected pages and API "
        "operations can be limited to authenticated users.",
    )

    add_heading(doc, "Problem Definition")
    add_paragraph(
        doc,
        "The main problem addressed by the project is the difficulty of managing restaurant operational records consistently "
        "when menu, food, table, order, invoice, and sales data are handled separately or manually. Manual handling can cause "
        "slow service, weak tracking, repeated data entry, and incomplete reports. The project therefore defines the following "
        "objectives:",
    )
    for item in [
        "Provide CRUD management for menus, foods, and tables.",
        "Provide a food ordering workflow that creates orders and order items together.",
        "Generate invoices from orders and allow payment status updates.",
        "Provide invoice search, date filtering, and related invoice viewing from the order page.",
        "Provide dashboard and reporting views for daily and monthly sales review.",
        "Prepare demo data that can be reset for presentation and testing.",
    ]:
        add_bullet(doc, item)
    add_paragraph(
        doc,
        "The project scope is limited to a web-based restaurant management prototype. It does not include POS hardware, real "
        "online payment processing, kitchen display devices, or production deployment automation.",
    )

    add_heading(doc, "Methodology")
    add_paragraph(
        doc,
        "The project follows an iterative full-stack development methodology. First, the data models and MongoDB collections "
        "are designed for menus, foods, tables, orders, order items, invoices, users, and sales reports. Next, REST API routes "
        "are implemented in the backend using Gin controllers. The frontend then consumes these APIs through an Axios client "
        "and presents workflows through React pages. Integration testing is performed by creating demo data, running the "
        "frontend build, and running Go tests.",
    )
    add_caption(doc, "Table 1. Main tools and technologies used in the project")
    add_table(
        doc,
        ["Layer", "Technology", "Purpose"],
        [
            ["Backend", "Go, Gin", "REST API implementation, routing, request validation, controller logic"],
            ["Database", "MongoDB", "Document storage for menus, foods, orders, invoices, and reports"],
            ["Authentication", "JWT", "Token-based access control for protected routes"],
            ["Frontend", "React, Vite", "Interactive single-page web application"],
            ["Styling/UI", "Tailwind CSS, Lucide icons", "Responsive interface, consistent controls, icon-based actions"],
            ["Integration", "Axios", "HTTP client for frontend-backend communication"],
            ["Reporting", "Recharts", "Dashboard and sales visualization support"],
        ],
        [Cm(3.2), Cm(4.2), Cm(8.4)],
    )

    add_heading(doc, "System Design and Implementation")
    add_paragraph(
        doc,
        "The system is organized as a client-server web application. The React frontend sends requests through an Axios API "
        "client to the Go/Gin backend. The backend validates requests, applies business rules, and stores data in MongoDB. "
        "The main ordering flow begins when a user browses the menu, adds foods to a cart, selects a table and payment "
        "information, and submits the order. The backend creates the order and order items, then an invoice is generated for "
        "that order.",
    )
    add_caption(doc, "Table 2. Major system modules")
    add_table(
        doc,
        ["Module", "Implemented Functions"],
        [
            ["Authentication", "Login, signup, protected frontend routes, and JWT support"],
            ["Menu Management", "Create and view restaurant menu categories"],
            ["Food Management", "Create and view foods with price, image, and menu relationship"],
            ["Table Management", "Create and view table number and guest capacity"],
            ["Order Food Workflow", "Cart, table selection, payment details, order creation, order item creation"],
            ["Invoice Management", "Invoice list, related invoice filtering, payment status update, edit, delete, date filter"],
            ["Reports", "Dashboard metrics, best sellers, daily sales details, summary report, reset demo script"],
        ],
        [Cm(4.2), Cm(11.6)],
    )

    add_heading(doc, "Results and Discussion")
    add_paragraph(
        doc,
        "The current prototype successfully demonstrates the main restaurant workflow. Demo menus, foods, and tables can be "
        "loaded into MongoDB using the reset script. Users can browse food items with images, add foods to a cart, select a "
        "table, and place an order. The system generates invoices from orders and displays invoice details including table "
        "number, order ID, food items, total amount, payment method, and payment status.",
    )
    add_paragraph(
        doc,
        "Several pain points were identified during review and fixed. The previous manual New Order flow was confusing because "
        "it created orders without food items. The visible workflow was simplified so users are guided to the complete Order "
        "Food process. The Orders page was improved with date filtering, newest-first sorting, readable table numbers, and "
        "related invoice navigation. The Invoices page was improved with date filtering and related invoice filtering from "
        "an order card. Backend invoice routes were consolidated so the frontend uses one canonical invoice API endpoint.",
    )
    add_caption(doc, "Table 3. Current verification results")
    add_table(
        doc,
        ["Verification Item", "Current Result"],
        [
            ["Backend test command", "go test ./... passes"],
            ["Frontend build command", "npm run build passes"],
            ["Demo data reset", "Script prepared to clear old demo records and insert fresh menus, foods, tables, orders, invoices, and report data"],
            ["Main ordering workflow", "Order Food flow creates order, order items, and invoice"],
            ["Invoice workflow", "Search, date filter, payment status update, edit, delete, and related order filter are available"],
        ],
        [Cm(5.2), Cm(10.6)],
    )

    add_heading(doc, "Challenges and Solutions")
    add_paragraph(
        doc,
        "One challenge was keeping frontend expectations consistent with backend API behavior. At first, some invoice pages "
        "used temporary public invoice routes while the backend also had formal invoice routes. This was solved by consolidating "
        "invoice handling under the main invoice controller and updating all frontend pages to use the same endpoint. Another "
        "challenge was ensuring that an invoice is linked to the exact order that was created. This was solved by returning "
        "the created order ID from the order item creation flow and using that ID when generating the invoice.",
    )
    add_paragraph(
        doc,
        "User interface complexity was another issue. Multiple entry points such as New Order and Order Food made the workflow "
        "unclear. The interface was simplified by making Order Food the primary path and redirecting manual order routes to "
        "that flow. Demo data consistency was also important for presentation, so a reset script was prepared to clear old "
        "records and insert a complete fresh dataset.",
    )

    add_heading(doc, "Future Work")
    add_paragraph(
        doc,
        "Future work will focus on production readiness and richer restaurant features. Role-based access control can be added "
        "for administrators, cashiers, and managers. Inventory tracking can be connected with food sales to estimate stock "
        "usage. Deployment can be prepared using Docker and environment-specific configuration. Report pages can be expanded "
        "with export functions, chart filtering, and monthly comparison. Finally, payment gateway integration may be added if "
        "the system is extended from a capstone prototype into a real point-of-sale product.",
    )

    add_heading(doc, "Conclusion")
    add_paragraph(
        doc,
        "The Restaurant Management System demonstrates how a full-stack web application can improve restaurant record handling "
        "and reduce manual workflow problems. The project integrates menu, food, table, order, invoice, and reporting features "
        "into one system. Current implementation and verification results show that the prototype is suitable for capstone "
        "demonstration and can be extended into a more complete restaurant operation platform.",
    )

    add_heading(doc, "Acknowledgment", 2)
    add_paragraph(
        doc,
        "The author would like to thank the supervisor, department, and university for their guidance and support throughout "
        "the capstone project. The author also acknowledges the documentation and open-source tools used during development.",
    )

    add_heading(doc, "References", 2)
    refs = [
        "The Go Authors. The Go Programming Language Documentation. Available: https://go.dev/doc/",
        "Gin Web Framework. Gin Documentation. Available: https://gin-gonic.com/docs/",
        "Meta Open Source. React Documentation. Available: https://react.dev/",
        "MongoDB Inc. MongoDB Manual. Available: https://www.mongodb.com/docs/",
        "Tailwind Labs. Tailwind CSS Documentation. Available: https://tailwindcss.com/docs",
        "Vite Team. Vite Documentation. Available: https://vite.dev/guide/",
    ]
    for ref in refs:
        add_numbered_ref(doc, ref)

    doc.save(OUT)


if __name__ == "__main__":
    build()
