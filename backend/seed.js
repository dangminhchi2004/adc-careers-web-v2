require("dotenv").config();
const db = require("./config/db");
const { ensureSchema } = require("./config/schema");

const fixedJobs = [
  {
    title: "Head of Production",
    vn: "Giám đốc Sản xuất",
    dept: "Khối Vận hành",
    level: "Senior Leadership",
    report: "P.TGĐ Vận hành",
    urgent: true,
    color: "#E8363A",
    status: "active",
    deadline: "2026-08-31",
    quantity: 1,
    ageRange: "35 - 48",
    gender: "Không yêu cầu",
    experienceText: "10+ năm quản lý sản xuất quy mô lớn",
    industry: "Sản xuất · Vận hành nhà máy",
    publishedAt: "2026-07-04",
    summary: "Dẫn dắt hoạt động sản xuất quy mô lớn, chuẩn hóa KPI, tối ưu năng suất và nâng cao năng lực vận hành của hệ thống nhà máy ADC.",
    reqs: [
      "10+ năm quản lý sản xuất quy mô lớn, ưu tiên môi trường trên 300 công nhân.",
      "Kinh nghiệm quản lý đa nhà máy, thiết lập KPI và cải tiến năng suất.",
      "Ngành nhựa, polymer hoặc extrusion là lợi thế lớn.",
      "Thành thạo SAP, Lean, 5S, Kaizen và tiếng Anh giao tiếp tốt."
    ],
    responsibilities: [
      "Điều hành kế hoạch sản xuất, năng lực nhân sự, máy móc và vật tư để đảm bảo sản lượng, chất lượng và tiến độ giao hàng.",
      "Xây dựng hệ thống KPI sản xuất, theo dõi hiệu suất và triển khai các chương trình cải tiến năng suất.",
      "Phối hợp với kế hoạch, bảo trì, chất lượng và kho vận để xử lý điểm nghẽn trong vận hành.",
      "Chuẩn hóa quy trình sản xuất, kiểm soát tuân thủ an toàn, 5S và kỷ luật vận hành.",
      "Đào tạo, phát triển đội ngũ quản lý cấp trung và xây dựng văn hóa cải tiến liên tục."
    ],
    requirementsDetail: [
      "Tốt nghiệp Đại học chuyên ngành Kỹ thuật, Quản lý công nghiệp, Cơ khí, Polymer hoặc lĩnh vực liên quan.",
      "Có kinh nghiệm điều hành sản xuất trong môi trường nhà máy quy mô lớn.",
      "Am hiểu quản trị năng suất, chất lượng, an toàn lao động và cải tiến liên tục.",
      "Có năng lực lãnh đạo đội ngũ lớn, ra quyết định nhanh và xử lý vấn đề hệ thống.",
      "Sử dụng tốt dữ liệu sản xuất, báo cáo KPI và các công cụ quản trị hiện đại."
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
    deadline: "2026-08-31",
    quantity: 1,
    ageRange: "32 - 45",
    gender: "Không yêu cầu",
    experienceText: "7+ năm HR management, ưu tiên ngành sản xuất",
    industry: "Nhân sự · Phát triển tổ chức",
    publishedAt: "2026-07-04",
    summary: "Thiết kế và vận hành hệ thống People & Organization giúp ADC thu hút, phát triển và giữ chân đội ngũ nhân sự phù hợp với chiến lược tăng trưởng.",
    reqs: [
      "7+ năm kinh nghiệm HR management, ưu tiên ngành sản xuất.",
      "Có kinh nghiệm xây dựng hệ thống HR từ nền tảng đến vận hành.",
      "Hiểu Employer Branding, Organization Development, C&B và L&D.",
      "Tiếng Anh tốt, tư duy hệ thống và khả năng đồng hành với business."
    ],
    responsibilities: [
      "Xây dựng chiến lược nhân sự, cơ cấu tổ chức và kế hoạch nguồn lực theo mục tiêu kinh doanh.",
      "Dẫn dắt các mảng tuyển dụng, C&B, đào tạo, phát triển tổ chức và truyền thông nội bộ.",
      "Thiết lập chính sách, quy trình và tiêu chuẩn vận hành nhân sự thống nhất toàn công ty.",
      "Đồng hành cùng các trưởng bộ phận trong quản trị hiệu suất, năng lực và kế hoạch kế nhiệm.",
      "Phát triển thương hiệu tuyển dụng và trải nghiệm nhân viên tại ADC."
    ],
    requirementsDetail: [
      "Tốt nghiệp Đại học chuyên ngành Quản trị nhân sự, Quản trị kinh doanh, Luật hoặc lĩnh vực liên quan.",
      "Có kinh nghiệm quản lý toàn diện chức năng nhân sự trong doanh nghiệp sản xuất hoặc quy mô tăng trưởng nhanh.",
      "Am hiểu luật lao động, hệ thống lương thưởng, đánh giá hiệu suất và phát triển năng lực.",
      "Có tư duy hệ thống, khả năng thiết kế chính sách và triển khai thực tế.",
      "Giao tiếp tốt, có năng lực tạo ảnh hưởng và đồng hành với lãnh đạo doanh nghiệp."
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
    deadline: "2026-08-31",
    quantity: 1,
    ageRange: "28 - 42",
    gender: "Không yêu cầu",
    experienceText: "7+ năm B2B sales trong sản xuất hoặc xuất khẩu",
    industry: "Kinh doanh quốc tế · B2B Export",
    publishedAt: "2026-07-04",
    summary: "Phát triển thị trường quốc tế, mở rộng khách hàng B2B và xây dựng pipeline xuất khẩu bền vững cho sản phẩm của ADC.",
    reqs: [
      "7+ năm B2B sales trong sản xuất hoặc xuất khẩu.",
      "Có network khách hàng tại Mỹ, Úc hoặc EU là lợi thế.",
      "Tiếng Anh thành thạo, đàm phán tốt và quen làm việc theo mục tiêu doanh số.",
      "Kinh nghiệm Salesforce CRM hoặc quy trình sales pipeline chuyên nghiệp."
    ],
    responsibilities: [
      "Xây dựng kế hoạch phát triển khách hàng quốc tế theo thị trường mục tiêu.",
      "Tìm kiếm, tiếp cận, đàm phán và chăm sóc khách hàng B2B trong lĩnh vực sản xuất hoặc xuất khẩu.",
      "Quản lý pipeline bán hàng, dự báo doanh số và cập nhật dữ liệu trên CRM.",
      "Phối hợp với sản xuất, kế hoạch và logistics để đảm bảo cam kết với khách hàng.",
      "Phân tích thị trường, đối thủ và đề xuất chiến lược giá, sản phẩm, kênh bán phù hợp."
    ],
    requirementsDetail: [
      "Tốt nghiệp Đại học chuyên ngành Kinh doanh quốc tế, Ngoại thương, Marketing hoặc lĩnh vực liên quan.",
      "Có thành tích phát triển khách hàng B2B và quản lý doanh số xuất khẩu.",
      "Tiếng Anh thương mại tốt, có khả năng thuyết trình và đàm phán với đối tác quốc tế.",
      "Hiểu quy trình xuất khẩu, Incoterms, thanh toán quốc tế và chăm sóc khách hàng doanh nghiệp.",
      "Chủ động, bền bỉ, có tư duy thị trường và kỷ luật theo đuổi mục tiêu."
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
    deadline: "2026-09-15",
    quantity: 1,
    ageRange: "30 - 42",
    gender: "Không yêu cầu",
    experienceText: "7+ năm planning trong môi trường sản xuất",
    industry: "Kế hoạch sản xuất · S&OP",
    publishedAt: "2026-07-04",
    summary: "Quản lý kế hoạch sản xuất, cân bằng năng lực nhà máy, tồn kho và cam kết giao hàng thông qua dữ liệu và quy trình S&OP.",
    reqs: [
      "7+ năm kinh nghiệm planning trong môi trường sản xuất.",
      "Thành thạo SAP PP/MM, MRP, S&OP và phối hợp liên phòng ban.",
      "Có tư duy dữ liệu, Power BI là lợi thế.",
      "Khả năng cân bằng năng lực sản xuất, tồn kho và cam kết giao hàng."
    ],
    responsibilities: [
      "Lập và điều phối kế hoạch sản xuất theo nhu cầu bán hàng, năng lực máy móc và nguồn lực vận hành.",
      "Theo dõi tồn kho, nguyên vật liệu, bán thành phẩm và thành phẩm để tối ưu dòng chảy sản xuất.",
      "Vận hành quy trình S&OP, MRP và phối hợp với mua hàng, kho, sản xuất, kinh doanh.",
      "Phân tích dữ liệu kế hoạch, cảnh báo rủi ro giao hàng và đề xuất phương án điều chỉnh.",
      "Chuẩn hóa báo cáo, dashboard và quy trình planning trong hệ thống."
    ],
    requirementsDetail: [
      "Tốt nghiệp Đại học chuyên ngành Quản lý công nghiệp, Logistics, Kỹ thuật hoặc lĩnh vực liên quan.",
      "Có kinh nghiệm lập kế hoạch sản xuất trong doanh nghiệp sản xuất nhiều mã hàng.",
      "Sử dụng tốt SAP PP/MM hoặc hệ thống ERP tương đương.",
      "Có khả năng phân tích dữ liệu, làm việc với Excel nâng cao hoặc Power BI.",
      "Giao tiếp tốt, phối hợp chặt chẽ với nhiều phòng ban và chịu áp lực tiến độ."
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
    deadline: "2026-09-30",
    quantity: 2,
    ageRange: "25 - 35",
    gender: "Không yêu cầu",
    experienceText: "3+ năm PLC, SCADA, HMI hoặc hệ thống điều khiển công nghiệp",
    industry: "Kỹ thuật · Tự động hóa",
    publishedAt: "2026-07-04",
    summary: "Tham gia vận hành, lập trình, xử lý sự cố và cải tiến hệ thống tự động hóa trong dây chuyền sản xuất hiện đại của ADC.",
    reqs: [
      "3+ năm kinh nghiệm PLC, SCADA, HMI hoặc hệ thống điều khiển công nghiệp.",
      "Từng làm việc với máy móc châu Âu là lợi thế.",
      "Có khả năng phân tích lỗi, cải tiến thiết bị và phối hợp với sản xuất.",
      "Sẵn sàng học hỏi từ nhà cung cấp máy móc quốc tế."
    ],
    responsibilities: [
      "Vận hành, giám sát và cải tiến hệ thống tự động hóa trong dây chuyền sản xuất.",
      "Lập trình, kiểm tra và xử lý sự cố liên quan đến PLC, SCADA, HMI, cảm biến và thiết bị điều khiển.",
      "Phối hợp với sản xuất, bảo trì và nhà cung cấp để tối ưu hiệu suất máy móc.",
      "Chuẩn hóa tài liệu kỹ thuật, hướng dẫn vận hành và quy trình xử lý sự cố thiết bị.",
      "Đề xuất giải pháp tự động hóa nhằm giảm thao tác thủ công, tăng độ ổn định và an toàn sản xuất."
    ],
    requirementsDetail: [
      "Tốt nghiệp Đại học/Cao đẳng chuyên ngành Tự động hóa, Điện - Điện tử, Cơ điện tử hoặc ngành liên quan.",
      "Có tối thiểu 3 năm kinh nghiệm làm việc với PLC, SCADA, HMI trong môi trường sản xuất.",
      "Có khả năng đọc hiểu bản vẽ điện, tài liệu kỹ thuật và làm việc với thiết bị công nghiệp.",
      "Kinh nghiệm với máy móc công nghệ châu Âu là lợi thế.",
      "Chủ động, cẩn thận, có tư duy phân tích nguyên nhân gốc và tinh thần cải tiến liên tục.",
      "Tiếng Anh đọc hiểu tài liệu kỹ thuật; giao tiếp cơ bản là lợi thế."
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
    deadline: "2026-09-15",
    quantity: 2,
    ageRange: "25 - 35",
    gender: "Không yêu cầu",
    experienceText: "3 - 5 năm sales B2B, ưu tiên export hoặc manufacturing",
    industry: "Kinh doanh B2B · Manufacturing",
    publishedAt: "2026-07-04",
    summary: "Chăm sóc khách hàng B2B, mở rộng cơ hội kinh doanh và theo sát pipeline bán hàng trong môi trường sản xuất định hướng xuất khẩu.",
    reqs: [
      "3-5 năm sales B2B, ưu tiên export hoặc manufacturing.",
      "Tiếng Anh tốt, có khả năng chăm sóc khách hàng quốc tế.",
      "Theo sát pipeline, báo cáo rõ ràng và chủ động mở rộng cơ hội.",
      "Tinh thần bền bỉ, chịu trách nhiệm với mục tiêu doanh số."
    ],
    responsibilities: [
      "Tìm kiếm và phát triển khách hàng B2B theo phân khúc, thị trường và mục tiêu doanh số.",
      "Chăm sóc khách hàng hiện hữu, tiếp nhận yêu cầu và phối hợp nội bộ để phản hồi kịp thời.",
      "Theo dõi pipeline, cập nhật CRM và báo cáo tiến độ bán hàng định kỳ.",
      "Phối hợp với sản xuất, kế hoạch và logistics để đảm bảo thông tin đơn hàng chính xác.",
      "Thu thập thông tin thị trường, đối thủ và đề xuất cơ hội mở rộng kinh doanh."
    ],
    requirementsDetail: [
      "Tốt nghiệp Đại học chuyên ngành Kinh doanh, Thương mại, Marketing hoặc lĩnh vực liên quan.",
      "Có kinh nghiệm bán hàng B2B, ưu tiên khách hàng doanh nghiệp sản xuất hoặc xuất khẩu.",
      "Tiếng Anh giao tiếp tốt, có khả năng viết email thương mại rõ ràng.",
      "Có tư duy dịch vụ khách hàng, kỷ luật theo dõi cơ hội và bám sát mục tiêu.",
      "Chủ động, kiên trì, giao tiếp tốt và sẵn sàng học về sản phẩm kỹ thuật."
    ]
  }
];

const legacyJobs = [
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

const defaultBenefits = [
  { icon: "🎓", text: "Đào tạo chuyên môn và cơ hội học hỏi từ chuyên gia trong ngành." },
  { icon: "💰", text: "Thu nhập cạnh tranh, thỏa thuận theo năng lực và phạm vi phụ trách." },
  { icon: "🛡️", text: "Bảo hiểm, khám sức khỏe và các chế độ phúc lợi theo chính sách công ty." },
  { icon: "🍱", text: "Hỗ trợ bữa ăn, điều kiện làm việc ổn định và môi trường thân thiện." },
  { icon: "📈", text: "Tham gia các dự án cải tiến, chuyển đổi số và tối ưu vận hành." },
  { icon: "🤝", text: "Đồng hành cùng đội ngũ quản lý giàu kinh nghiệm, đề cao tinh thần hợp tác." }
];

const defaultEnvironmentSections = [
  {
    title: "Nhà máy hiện đại",
    content: "ADC vận hành hệ thống nhà máy tại KCN Tân Tạo với máy móc, quy trình và tiêu chuẩn quản lý hướng đến hiệu suất ổn định."
  },
  {
    title: "Chuyển đổi số trong vận hành",
    content: "Môi trường ứng dụng SAP HANA, Salesforce CRM, Office 365, Power BI và các giải pháp tự động hóa để hỗ trợ quyết định dựa trên dữ liệu."
  },
  {
    title: "Văn hóa cải tiến liên tục",
    content: "ADC khuyến khích tinh thần chủ động, học hỏi, phối hợp liên phòng ban và đề xuất giải pháp tạo giá trị bền vững."
  },
  {
    title: "Giá trị cốt lõi Đẹp - Mạnh - Giàu",
    content: "Đẹp trong con người và sản phẩm, mạnh trong năng lực vận hành, giàu về tri thức, nhân văn và khả năng tạo giá trị."
  }
];

function buildJobDetail(job) {
  return {
    ...job,
    slug: slugify(job.title),
    employmentType: "Full-time",
    workLocation: "KCN Tân Tạo, Bình Tân, TP.HCM",
    locationShort: "TP.HCM",
    salaryText: "Thỏa thuận theo năng lực",
    benefits: job.benefits || defaultBenefits,
    environmentSections: job.environmentSections || defaultEnvironmentSections
  };
}

function slugify(value) {
  return String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

async function seed() {
  try {
    await ensureSchema();

    await db.query("SET FOREIGN_KEY_CHECKS = 0");
    await db.query("TRUNCATE TABLE applications");
    await db.query("TRUNCATE TABLE jobs");
    await db.query("SET FOREIGN_KEY_CHECKS = 1");

    const values = fixedJobs.map((job) => {
      const detail = buildJobDetail(job);
      return [
        detail.title,
        detail.vn,
        detail.dept,
        detail.level,
        detail.report,
        detail.urgent ? 1 : 0,
        detail.color,
        JSON.stringify(detail.reqs),
        detail.slug,
        detail.summary,
        detail.employmentType,
        detail.workLocation,
        detail.locationShort,
        detail.salaryText,
        detail.deadline,
        detail.quantity,
        detail.ageRange,
        detail.gender,
        detail.experienceText,
        detail.industry,
        detail.publishedAt,
        JSON.stringify(detail.responsibilities),
        JSON.stringify(detail.requirementsDetail),
        JSON.stringify(detail.benefits),
        JSON.stringify(detail.environmentSections),
        detail.status
      ];
    });

    await db.query(
      `INSERT INTO jobs
        (title, vn, dept, level, report, urgent, color, reqs, slug, summary,
         employment_type, work_location, location_short, salary_text, deadline,
         quantity, age_range, gender, experience_text, industry, published_at,
         responsibilities, requirements_detail, benefits, environment_sections, status)
       VALUES ?`,
      [values]
    );

    console.log(`Seed completed: ${fixedJobs.length} jobs inserted.`);
  } catch (error) {
    console.error("Seed failed:", error);
    process.exitCode = 1;
  } finally {
    await db.end();
  }
}

seed();
