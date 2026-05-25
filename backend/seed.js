require("dotenv").config();
const db = require("./config/db");
const { ensureSchema } = require("./config/schema");

const jobs = [
  {
    title: "Head of Production",
    vn: "Giám đốc Sản xuất",
    dept: "Khối Vận hành",
    level: "Senior Leadership",
    report: "P.TGĐ Vận hành",
    urgent: true,
    color: "#E8363A",
    status: "active",
    reqs: [
      "10+ năm quản lý sản xuất quy mô lớn, ưu tiên môi trường trên 300 công nhân.",
      "Kinh nghiệm quản lý đa nhà máy, thiết lập KPI và cải tiến năng suất.",
      "Ngành nhựa, polymer hoặc extrusion là lợi thế lớn.",
      "Thành thạo SAP, Lean, 5S, Kaizen và tiếng Anh giao tiếp tốt."
    ]
  },
  {
    title: "Head of P&O",
    vn: "Giám đốc Nhân sự & Tổ chức",
    dept: "People & Organization",
    level: "Senior Leadership",
    report: "CEO",
    urgent: true,
    color: "#F57C22",
    status: "active",
    reqs: [
      "7+ năm kinh nghiệm HR management, ưu tiên ngành sản xuất.",
      "Có kinh nghiệm xây dựng hệ thống HR từ nền tảng đến vận hành.",
      "Hiểu Employer Branding, Organization Development, C&B và L&D.",
      "Tiếng Anh tốt, tư duy hệ thống và khả năng đồng hành với business."
    ]
  },
  {
    title: "International Sales Manager",
    vn: "Trưởng phòng Kinh doanh Quốc tế",
    dept: "Kinh doanh",
    level: "Management",
    report: "CEO",
    urgent: true,
    color: "#FFB900",
    status: "active",
    reqs: [
      "7+ năm B2B sales trong sản xuất hoặc xuất khẩu.",
      "Có network khách hàng tại Mỹ, Úc hoặc EU là lợi thế.",
      "Tiếng Anh thành thạo, đàm phán tốt và quen làm việc theo mục tiêu doanh số.",
      "Kinh nghiệm Salesforce CRM hoặc quy trình sales pipeline chuyên nghiệp."
    ]
  },
  {
    title: "Head of Production Planning",
    vn: "Trưởng phòng Kế hoạch Sản xuất",
    dept: "Khối Vận hành",
    level: "Management",
    report: "P.TGĐ Vận hành",
    urgent: false,
    color: "#4CAF50",
    status: "active",
    reqs: [
      "7+ năm kinh nghiệm planning trong môi trường sản xuất.",
      "Thành thạo SAP PP/MM, MRP, S&OP và phối hợp liên phòng ban.",
      "Có tư duy dữ liệu, Power BI là lợi thế.",
      "Khả năng cân bằng năng lực sản xuất, tồn kho và cam kết giao hàng."
    ]
  },
  {
    title: "Automation Engineer",
    vn: "Kỹ sư Tự động hóa",
    dept: "Kỹ thuật",
    level: "Specialist",
    report: "Head of Production",
    urgent: false,
    color: "#2196F3",
    status: "active",
    reqs: [
      "3+ năm kinh nghiệm PLC, SCADA, HMI hoặc hệ thống điều khiển công nghiệp.",
      "Từng làm việc với máy móc châu Âu là lợi thế.",
      "Có khả năng phân tích lỗi, cải tiến thiết bị và phối hợp với sản xuất.",
      "Sẵn sàng học hỏi từ nhà cung cấp máy móc quốc tế."
    ]
  },
  {
    title: "Senior Sales Executive",
    vn: "Chuyên viên Kinh doanh Cấp cao",
    dept: "Kinh doanh",
    level: "Senior",
    report: "Sales Manager",
    urgent: false,
    color: "#9C27B0",
    status: "active",
    reqs: [
      "3-5 năm sales B2B, ưu tiên export hoặc manufacturing.",
      "Tiếng Anh tốt, có khả năng chăm sóc khách hàng quốc tế.",
      "Theo sát pipeline, báo cáo rõ ràng và chủ động mở rộng cơ hội.",
      "Tinh thần bền bỉ, chịu trách nhiệm với mục tiêu doanh số."
    ]
  }
];

async function seed() {
  try {
    await ensureSchema();

    await db.query("SET FOREIGN_KEY_CHECKS = 0");
    await db.query("TRUNCATE TABLE applications");
    await db.query("TRUNCATE TABLE jobs");
    await db.query("SET FOREIGN_KEY_CHECKS = 1");

    const values = jobs.map((job) => [
      job.title,
      job.vn,
      job.dept,
      job.level,
      job.report,
      job.urgent ? 1 : 0,
      job.color,
      JSON.stringify(job.reqs),
      job.status
    ]);

    await db.query(
      `INSERT INTO jobs
        (title, vn, dept, level, report, urgent, color, reqs, status)
       VALUES ?`,
      [values]
    );

    console.log(`Seed completed: ${jobs.length} jobs inserted.`);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

seed();
