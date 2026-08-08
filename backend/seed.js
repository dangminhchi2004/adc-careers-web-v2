require("dotenv").config();
const db = require("./config/db");
const { ensureSchema } = require("./config/schema");

const fixedJobs = [
  {
    title: "Production Shift Supervisor",
    vn: "Trưởng ca Sản xuất",
    dept: "Khối Vận hành",
    level: "Management",
    report: "Head of Production",
    urgent: true,
    color: "#E8363A",
    status: "active",
    deadline: "2026-09-15",
    quantity: 2,
    ageRange: "28 - 40",
    gender: "Không yêu cầu",
    experienceText: "3+ năm giám sát ca sản xuất trong nhà máy",
    industry: "Sản xuất · Vận hành nhà máy",
    publishedAt: "2026-08-08",
    summary: "Giám sát trực tiếp ca sản xuất, đảm bảo sản lượng, chất lượng và an toàn lao động theo đúng kế hoạch và tiêu chuẩn của ADC.",
    reqs: [
      "3+ năm kinh nghiệm giám sát ca sản xuất, ưu tiên ngành nhựa, dây thừng, sợi hoặc polymer.",
      "Nắm vững quy trình vận hành máy móc và kỷ luật sản xuất theo ca.",
      "Có khả năng xử lý sự cố nhanh, điều phối nhân sự và báo cáo kịp thời.",
      "Thành thạo Excel, quen làm việc với KPI sản lượng và biểu mẫu 5S."
    ],
    responsibilities: [
      "Điều phối nhân sự, máy móc và vật tư trong ca để đảm bảo sản lượng và tiến độ giao hàng.",
      "Giám sát tuân thủ quy trình vận hành, an toàn lao động và tiêu chuẩn chất lượng trong ca.",
      "Ghi nhận, xử lý sự cố phát sinh và báo cáo cấp trên khi vượt thẩm quyền.",
      "Đào tạo, kèm cặp công nhân mới và duy trì kỷ luật sản xuất.",
      "Cập nhật số liệu sản lượng, downtime và đề xuất cải tiến năng suất ca."
    ],
    requirementsDetail: [
      "Tốt nghiệp Trung cấp/Cao đẳng/Đại học chuyên ngành Kỹ thuật, Quản lý công nghiệp hoặc liên quan.",
      "Có kinh nghiệm giám sát trực tiếp công nhân sản xuất theo ca.",
      "Hiểu quy trình 5S, an toàn lao động và kiểm soát chất lượng cơ bản.",
      "Khả năng chịu áp lực, xử lý tình huống và ra quyết định nhanh.",
      "Sẵn sàng làm việc theo ca luân phiên, kể cả cuối tuần khi cần."
    ]
  },
  {
    title: "Production Line Technician",
    vn: "Kỹ thuật viên Vận hành Dây chuyền",
    dept: "Khối Vận hành",
    level: "Specialist",
    report: "Trưởng ca Sản xuất",
    urgent: false,
    color: "#E8363A",
    status: "active",
    deadline: "2026-09-30",
    quantity: 4,
    ageRange: "22 - 35",
    gender: "Không yêu cầu",
    experienceText: "1+ năm vận hành máy sản xuất, ưu tiên ngành nhựa/sợi",
    industry: "Sản xuất · Vận hành nhà máy",
    publishedAt: "2026-08-08",
    summary: "Trực tiếp vận hành, theo dõi và bảo dưỡng cơ bản dây chuyền sản xuất, đảm bảo máy chạy ổn định và đúng thông số kỹ thuật.",
    reqs: [
      "1+ năm kinh nghiệm vận hành máy sản xuất, ưu tiên ngành nhựa, sợi hoặc dây thừng.",
      "Đọc hiểu được thông số kỹ thuật cơ bản và bảng điều khiển máy.",
      "Cẩn thận, chăm chỉ và có tinh thần trách nhiệm với sản phẩm.",
      "Sẵn sàng đào tạo nếu chưa có kinh nghiệm nhưng có nền tảng kỹ thuật."
    ],
    responsibilities: [
      "Vận hành máy móc dây chuyền sản xuất theo đúng quy trình và thông số kỹ thuật.",
      "Theo dõi tình trạng máy, phát hiện bất thường và báo cáo kịp thời cho trưởng ca.",
      "Thực hiện bảo dưỡng cơ bản, vệ sinh máy móc và khu vực làm việc theo 5S.",
      "Kiểm tra chất lượng bán thành phẩm/thành phẩm trong quá trình sản xuất.",
      "Ghi chép nhật ký vận hành và số liệu sản lượng theo ca."
    ],
    requirementsDetail: [
      "Tốt nghiệp Trung cấp/Cao đẳng nghề Cơ khí, Điện - Điện tử hoặc lĩnh vực liên quan.",
      "Có sức khỏe tốt, chịu được cường độ làm việc trong môi trường nhà máy.",
      "Có tinh thần học hỏi, tuân thủ quy trình và kỷ luật sản xuất.",
      "Ưu tiên ứng viên có kinh nghiệm vận hành máy đùn, máy se sợi hoặc máy bện.",
      "Sẵn sàng làm việc theo ca luân phiên."
    ]
  },
  {
    title: "Talent Acquisition Specialist",
    vn: "Chuyên viên Tuyển dụng",
    dept: "People & Organization",
    level: "Specialist",
    report: "Head of P&O",
    urgent: true,
    color: "#F57C22",
    status: "active",
    deadline: "2026-09-15",
    quantity: 1,
    ageRange: "24 - 32",
    gender: "Không yêu cầu",
    experienceText: "2+ năm tuyển dụng, ưu tiên môi trường sản xuất",
    industry: "Nhân sự · Tuyển dụng",
    publishedAt: "2026-08-08",
    summary: "Chủ động tìm kiếm, sàng lọc và thu hút ứng viên phù hợp cho các vị trí tại nhà máy và khối văn phòng của ADC.",
    reqs: [
      "2+ năm kinh nghiệm tuyển dụng, ưu tiên ứng viên từng làm trong doanh nghiệp sản xuất.",
      "Thành thạo các kênh tuyển dụng online, headhunting cơ bản và phỏng vấn sơ tuyển.",
      "Kỹ năng giao tiếp, đánh giá ứng viên và quản lý pipeline tuyển dụng tốt.",
      "Sử dụng thành thạo Excel, quen thao tác trên các nền tảng đăng tuyển phổ biến."
    ],
    responsibilities: [
      "Lên kế hoạch và triển khai tuyển dụng theo nhu cầu nhân sự của các phòng ban.",
      "Đăng tin, tìm kiếm, sàng lọc hồ sơ và tổ chức phỏng vấn ứng viên.",
      "Xây dựng và duy trì nguồn ứng viên tiềm năng (talent pool) cho các vị trí trọng yếu.",
      "Phối hợp với quản lý trực tiếp để xác định tiêu chí tuyển dụng phù hợp.",
      "Theo dõi, báo cáo hiệu quả tuyển dụng và đề xuất cải tiến quy trình."
    ],
    requirementsDetail: [
      "Tốt nghiệp Đại học chuyên ngành Quản trị nhân sự, Quản trị kinh doanh hoặc liên quan.",
      "Có kinh nghiệm tuyển dụng đa vị trí, từ lao động phổ thông đến quản lý cấp trung.",
      "Kỹ năng phỏng vấn, đánh giá năng lực và giao tiếp tốt.",
      "Chủ động, chịu được áp lực chỉ tiêu tuyển dụng theo thời gian.",
      "Am hiểu luật lao động cơ bản liên quan đến tuyển dụng là lợi thế."
    ]
  },
  {
    title: "Compensation & Benefits Specialist",
    vn: "Chuyên viên C&B",
    dept: "People & Organization",
    level: "Specialist",
    report: "Head of P&O",
    urgent: false,
    color: "#F57C22",
    status: "active",
    deadline: "2026-09-30",
    quantity: 1,
    ageRange: "25 - 35",
    gender: "Không yêu cầu",
    experienceText: "3+ năm C&B, thành thạo luật lao động và BHXH",
    industry: "Nhân sự · Lương thưởng & Phúc lợi",
    publishedAt: "2026-08-08",
    summary: "Quản lý chính sách lương, thưởng, phúc lợi và bảo hiểm xã hội, đảm bảo tuân thủ pháp luật lao động và tính chính xác trong tính lương.",
    reqs: [
      "3+ năm kinh nghiệm C&B, thành thạo quy trình tính lương và BHXH.",
      "Am hiểu Luật Lao động, Luật BHXH và các quy định thuế TNCN liên quan.",
      "Cẩn thận, chính xác cao và bảo mật thông tin lương thưởng tốt.",
      "Thành thạo Excel nâng cao, có kinh nghiệm phần mềm tính lương là lợi thế."
    ],
    responsibilities: [
      "Thực hiện tính lương, thưởng, phụ cấp hàng tháng cho toàn bộ nhân viên.",
      "Quản lý hồ sơ BHXH, BHYT, BHTN và các thủ tục liên quan đến chế độ nhân sự.",
      "Xây dựng, rà soát chính sách lương thưởng, phúc lợi phù hợp với thị trường.",
      "Giải đáp thắc mắc của nhân viên liên quan đến lương, phúc lợi và chế độ.",
      "Lập báo cáo nhân sự, chi phí lương định kỳ cho Ban lãnh đạo."
    ],
    requirementsDetail: [
      "Tốt nghiệp Đại học chuyên ngành Nhân sự, Kế toán, Luật hoặc liên quan.",
      "Có kinh nghiệm thực tế tính lương cho doanh nghiệp sản xuất quy mô trên 200 lao động là lợi thế.",
      "Nắm vững quy định pháp luật lao động, BHXH và thuế TNCN hiện hành.",
      "Kỹ năng làm việc với số liệu, cẩn trọng và đúng deadline.",
      "Trung thực, có tinh thần trách nhiệm cao với thông tin nhạy cảm."
    ]
  },
  {
    title: "Domestic Sales Executive",
    vn: "Nhân viên Kinh doanh Nội địa",
    dept: "Kinh doanh",
    level: "Executive",
    report: "Sales Manager",
    urgent: true,
    color: "#FFB900",
    status: "active",
    deadline: "2026-09-15",
    quantity: 3,
    ageRange: "22 - 32",
    gender: "Không yêu cầu",
    experienceText: "1+ năm sales, ưu tiên B2B hoặc phân phối",
    industry: "Kinh doanh nội địa · B2B",
    publishedAt: "2026-08-08",
    summary: "Phát triển và chăm sóc khách hàng nội địa, mở rộng kênh phân phối và đạt chỉ tiêu doanh số được giao hàng tháng.",
    reqs: [
      "1+ năm kinh nghiệm sales, ưu tiên B2B hoặc kênh phân phối/đại lý.",
      "Giao tiếp tốt, chủ động tìm kiếm khách hàng mới.",
      "Chịu được áp lực doanh số và sẵn sàng đi thị trường khi cần.",
      "Có phương tiện di chuyển cá nhân để đi gặp khách hàng."
    ],
    responsibilities: [
      "Tìm kiếm, tiếp cận và phát triển khách hàng mới trong thị trường nội địa.",
      "Chăm sóc khách hàng hiện hữu, xử lý đơn hàng và khiếu nại phát sinh.",
      "Theo dõi doanh số, báo cáo kết quả bán hàng theo tuần/tháng.",
      "Phối hợp với kho, sản xuất để đảm bảo giao hàng đúng cam kết.",
      "Thu thập thông tin thị trường, đối thủ để đề xuất cho quản lý trực tiếp."
    ],
    requirementsDetail: [
      "Tốt nghiệp Trung cấp/Cao đẳng/Đại học chuyên ngành Kinh doanh, Marketing hoặc liên quan.",
      "Ưu tiên ứng viên có kinh nghiệm bán hàng vật liệu công nghiệp, dây thừng, bao bì.",
      "Kỹ năng đàm phán, thuyết phục và xây dựng quan hệ khách hàng.",
      "Chủ động, chịu khó và có tinh thần cầu tiến.",
      "Sẵn sàng công tác tỉnh khi có yêu cầu."
    ]
  },
  {
    title: "Customer Service Executive",
    vn: "Chuyên viên Chăm sóc Khách hàng",
    dept: "Kinh doanh",
    level: "Specialist",
    report: "Sales Manager",
    urgent: false,
    color: "#FFB900",
    status: "active",
    deadline: "2026-09-30",
    quantity: 2,
    ageRange: "22 - 30",
    gender: "Không yêu cầu",
    experienceText: "1+ năm chăm sóc khách hàng hoặc dịch vụ khách hàng",
    industry: "Kinh doanh · Dịch vụ khách hàng",
    publishedAt: "2026-08-08",
    summary: "Tiếp nhận, xử lý yêu cầu và đảm bảo trải nghiệm dịch vụ tốt cho khách hàng trong suốt quá trình đặt hàng và sau bán.",
    reqs: [
      "1+ năm kinh nghiệm chăm sóc khách hàng, tổng đài hoặc dịch vụ khách hàng.",
      "Giao tiếp rõ ràng, kiên nhẫn và xử lý tình huống khéo léo.",
      "Thành thạo tin học văn phòng, quen thao tác trên phần mềm CRM.",
      "Chịu được áp lực khi khối lượng yêu cầu tăng cao theo mùa vụ."
    ],
    responsibilities: [
      "Tiếp nhận đơn hàng, yêu cầu và phản hồi khách hàng qua điện thoại, email.",
      "Theo dõi tiến độ đơn hàng, phối hợp nội bộ để đảm bảo giao hàng đúng hẹn.",
      "Xử lý khiếu nại, phản ánh của khách hàng và báo cáo cấp trên khi cần hỗ trợ.",
      "Cập nhật thông tin khách hàng, đơn hàng đầy đủ trên hệ thống CRM.",
      "Khảo sát mức độ hài lòng và đề xuất cải thiện chất lượng dịch vụ."
    ],
    requirementsDetail: [
      "Tốt nghiệp Trung cấp/Cao đẳng/Đại học chuyên ngành Kinh doanh, Ngôn ngữ hoặc liên quan.",
      "Có kỹ năng giao tiếp tốt, giọng nói rõ ràng và thái độ phục vụ chuyên nghiệp.",
      "Cẩn thận, có khả năng xử lý đa nhiệm và ưu tiên công việc hợp lý.",
      "Ưu tiên ứng viên từng làm dịch vụ khách hàng ngành sản xuất/xuất khẩu.",
      "Trung thực, chịu trách nhiệm với thông tin khách hàng."
    ]
  },
  {
    title: "Maintenance Engineer",
    vn: "Kỹ sư Bảo trì",
    dept: "Kỹ thuật",
    level: "Specialist",
    report: "Head of Production",
    urgent: true,
    color: "#4CAF50",
    status: "active",
    deadline: "2026-09-15",
    quantity: 2,
    ageRange: "25 - 38",
    gender: "Không yêu cầu",
    experienceText: "3+ năm bảo trì máy móc công nghiệp",
    industry: "Kỹ thuật · Bảo trì thiết bị",
    publishedAt: "2026-08-08",
    summary: "Đảm bảo máy móc, thiết bị sản xuất vận hành ổn định thông qua bảo trì phòng ngừa và xử lý sự cố kịp thời.",
    reqs: [
      "3+ năm kinh nghiệm bảo trì máy móc trong môi trường sản xuất.",
      "Đọc hiểu bản vẽ kỹ thuật, sơ đồ điện và tài liệu máy móc.",
      "Có khả năng chẩn đoán và xử lý sự cố cơ - điện nhanh, chính xác.",
      "Chủ động lập kế hoạch bảo trì phòng ngừa, hạn chế downtime."
    ],
    responsibilities: [
      "Thực hiện bảo trì định kỳ, bảo trì phòng ngừa cho máy móc, thiết bị nhà máy.",
      "Xử lý sự cố phát sinh nhanh chóng để giảm thiểu thời gian dừng máy.",
      "Lập và cập nhật hồ sơ bảo trì, lịch sử sửa chữa thiết bị.",
      "Đề xuất cải tiến kỹ thuật nhằm tăng độ tin cậy và tuổi thọ máy móc.",
      "Phối hợp với sản xuất để lên lịch bảo trì không ảnh hưởng tiến độ."
    ],
    requirementsDetail: [
      "Tốt nghiệp Cao đẳng/Đại học chuyên ngành Cơ khí, Điện - Điện tử hoặc liên quan.",
      "Có kinh nghiệm bảo trì máy móc ngành nhựa, sợi hoặc cơ khí chính xác là lợi thế.",
      "Kỹ năng sử dụng thiết bị đo lường, chẩn đoán kỹ thuật cơ bản.",
      "Cẩn thận, tuân thủ an toàn lao động khi làm việc với máy móc.",
      "Sẵn sàng hỗ trợ xử lý sự cố ngoài giờ khi cần thiết."
    ]
  },
  {
    title: "Electromechanical Engineer",
    vn: "Kỹ sư Cơ điện",
    dept: "Kỹ thuật",
    level: "Specialist",
    report: "Head of Production",
    urgent: false,
    color: "#4CAF50",
    status: "active",
    deadline: "2026-09-30",
    quantity: 1,
    ageRange: "24 - 35",
    gender: "Không yêu cầu",
    experienceText: "2+ năm thiết kế/vận hành hệ thống cơ điện",
    industry: "Kỹ thuật · Cơ điện",
    publishedAt: "2026-08-08",
    summary: "Thiết kế, lắp đặt và cải tiến hệ thống cơ điện phục vụ dây chuyền sản xuất, đảm bảo vận hành an toàn và hiệu quả.",
    reqs: [
      "2+ năm kinh nghiệm thiết kế hoặc vận hành hệ thống cơ điện công nghiệp.",
      "Thành thạo phần mềm thiết kế cơ khí/điện cơ bản (AutoCAD hoặc tương đương).",
      "Hiểu nguyên lý hoạt động của động cơ, hệ truyền động và tủ điện công nghiệp.",
      "Có tư duy cải tiến kỹ thuật và làm việc nhóm tốt."
    ],
    responsibilities: [
      "Tham gia thiết kế, lắp đặt và hiệu chỉnh hệ thống cơ điện cho dây chuyền sản xuất.",
      "Kiểm tra, giám sát thi công các hạng mục cơ điện đảm bảo đúng kỹ thuật.",
      "Phối hợp với bộ phận bảo trì xử lý sự cố liên quan đến hệ thống cơ điện.",
      "Lập tài liệu kỹ thuật, bản vẽ hoàn công cho các hạng mục cải tạo.",
      "Đề xuất giải pháp nâng cấp, tối ưu hệ thống cơ điện hiện hữu."
    ],
    requirementsDetail: [
      "Tốt nghiệp Đại học chuyên ngành Cơ điện tử, Điện công nghiệp hoặc liên quan.",
      "Có kinh nghiệm làm việc với hệ thống điện động lực, tủ điện trong nhà máy.",
      "Kỹ năng đọc bản vẽ kỹ thuật cơ - điện thành thạo.",
      "Cẩn thận, có ý thức an toàn điện cao khi làm việc thực tế.",
      "Tiếng Anh đọc hiểu tài liệu kỹ thuật là lợi thế."
    ]
  },
  {
    title: "QA/QC Team Lead",
    vn: "Trưởng nhóm QA/QC",
    dept: "Chất lượng",
    level: "Management",
    report: "Head of Production",
    urgent: false,
    color: "#2196F3",
    status: "active",
    deadline: "2026-09-30",
    quantity: 1,
    ageRange: "28 - 40",
    gender: "Không yêu cầu",
    experienceText: "5+ năm QA/QC trong sản xuất, có kinh nghiệm quản lý nhóm",
    industry: "Chất lượng · Quản lý hệ thống",
    publishedAt: "2026-08-08",
    summary: "Xây dựng và giám sát hệ thống kiểm soát chất lượng toàn nhà máy, đảm bảo sản phẩm đạt tiêu chuẩn trước khi xuất xưởng.",
    reqs: [
      "5+ năm kinh nghiệm QA/QC trong doanh nghiệp sản xuất, có kinh nghiệm quản lý nhóm.",
      "Am hiểu hệ thống quản lý chất lượng (ISO 9001 hoặc tương đương).",
      "Có khả năng xây dựng tiêu chuẩn kiểm tra và đào tạo nhân viên QC.",
      "Kỹ năng phân tích dữ liệu chất lượng, lập báo cáo và đề xuất cải tiến."
    ],
    responsibilities: [
      "Xây dựng, cập nhật quy trình và tiêu chuẩn kiểm soát chất lượng sản phẩm.",
      "Quản lý, đào tạo đội ngũ nhân viên QC kiểm tra tại các công đoạn sản xuất.",
      "Phân tích nguyên nhân lỗi, phối hợp sản xuất khắc phục và phòng ngừa tái diễn.",
      "Xử lý khiếu nại chất lượng từ khách hàng, phối hợp kinh doanh phản hồi kịp thời.",
      "Báo cáo chỉ số chất lượng định kỳ cho Ban lãnh đạo."
    ],
    requirementsDetail: [
      "Tốt nghiệp Đại học chuyên ngành Kỹ thuật, Hóa - Polymer, Quản lý chất lượng hoặc liên quan.",
      "Có kinh nghiệm xây dựng và vận hành hệ thống quản lý chất lượng thực tế.",
      "Kỹ năng lãnh đạo nhóm, đào tạo và giải quyết vấn đề hệ thống.",
      "Tư duy dữ liệu, thành thạo Excel/Power BI để theo dõi chỉ số chất lượng.",
      "Chịu được áp lực, quyết đoán khi xử lý tình huống chất lượng khẩn cấp."
    ]
  },
  {
    title: "QC Inspector",
    vn: "Nhân viên Kiểm soát Chất lượng",
    dept: "Chất lượng",
    level: "Junior",
    report: "Trưởng nhóm QA/QC",
    urgent: true,
    color: "#2196F3",
    status: "active",
    deadline: "2026-09-15",
    quantity: 3,
    ageRange: "20 - 30",
    gender: "Không yêu cầu",
    experienceText: "Không yêu cầu kinh nghiệm, ưu tiên đã từng làm QC",
    industry: "Chất lượng · Kiểm tra sản phẩm",
    publishedAt: "2026-08-08",
    summary: "Kiểm tra chất lượng nguyên vật liệu, bán thành phẩm và thành phẩm theo tiêu chuẩn của công ty tại các công đoạn sản xuất.",
    reqs: [
      "Không yêu cầu kinh nghiệm, ưu tiên ứng viên từng làm QC/QA trong nhà máy.",
      "Cẩn thận, tỉ mỉ và có khả năng quan sát tốt.",
      "Đọc hiểu được tiêu chuẩn kiểm tra và ghi chép số liệu chính xác.",
      "Sẵn sàng làm việc theo ca tại xưởng sản xuất."
    ],
    responsibilities: [
      "Kiểm tra chất lượng nguyên vật liệu đầu vào theo tiêu chuẩn quy định.",
      "Kiểm tra bán thành phẩm, thành phẩm tại các công đoạn sản xuất theo ca.",
      "Ghi nhận, báo cáo kịp thời các trường hợp không đạt tiêu chuẩn chất lượng.",
      "Phối hợp trưởng nhóm QA/QC xử lý sản phẩm lỗi, cách ly hàng không đạt.",
      "Lưu trữ hồ sơ kiểm tra chất lượng đầy đủ, rõ ràng."
    ],
    requirementsDetail: [
      "Tốt nghiệp Trung cấp/Cao đẳng trở lên, ưu tiên chuyên ngành Kỹ thuật, Hóa học.",
      "Có sức khỏe tốt, chịu được cường độ làm việc tại xưởng sản xuất.",
      "Trung thực, có trách nhiệm với kết quả kiểm tra chất lượng.",
      "Sẵn sàng học hỏi tiêu chuẩn kiểm tra mới của công ty.",
      "Sẵn sàng làm việc theo ca luân phiên."
    ]
  },
  {
    title: "Warehouse Supervisor",
    vn: "Trưởng nhóm Kho vận",
    dept: "Kho vận & Chuỗi cung ứng",
    level: "Management",
    report: "Head of Production Planning",
    urgent: false,
    color: "#5C6BC0",
    status: "active",
    deadline: "2026-09-30",
    quantity: 1,
    ageRange: "27 - 40",
    gender: "Không yêu cầu",
    experienceText: "4+ năm quản lý kho, ưu tiên môi trường sản xuất/xuất khẩu",
    industry: "Kho vận · Chuỗi cung ứng",
    publishedAt: "2026-08-08",
    summary: "Quản lý toàn bộ hoạt động kho nguyên liệu và thành phẩm, đảm bảo xuất - nhập - tồn chính xác và kịp thời.",
    reqs: [
      "4+ năm kinh nghiệm quản lý kho, ưu tiên doanh nghiệp sản xuất hoặc xuất khẩu.",
      "Thành thạo quy trình xuất nhập kho, kiểm kê và quản lý tồn kho theo hệ thống.",
      "Kỹ năng quản lý nhân sự kho và sắp xếp, tối ưu không gian lưu trữ.",
      "Sử dụng thành thạo Excel, có kinh nghiệm phần mềm quản lý kho (WMS/ERP) là lợi thế."
    ],
    responsibilities: [
      "Quản lý hoạt động xuất, nhập, tồn kho nguyên vật liệu và thành phẩm.",
      "Tổ chức kiểm kê định kỳ, đối chiếu số liệu thực tế với hệ thống.",
      "Sắp xếp, bố trí kho khoa học nhằm tối ưu diện tích và thời gian xuất nhập.",
      "Giám sát đội ngũ nhân viên kho, đảm bảo an toàn và kỷ luật lao động.",
      "Phối hợp kế hoạch sản xuất và kinh doanh để đảm bảo hàng hóa sẵn sàng giao."
    ],
    requirementsDetail: [
      "Tốt nghiệp Cao đẳng/Đại học chuyên ngành Logistics, Quản lý chuỗi cung ứng hoặc liên quan.",
      "Có kinh nghiệm quản lý kho quy mô lớn, nhiều chủng loại hàng hóa.",
      "Am hiểu quy trình kiểm soát tồn kho, FIFO/FEFO và an toàn kho bãi.",
      "Kỹ năng quản lý đội nhóm, phân công công việc hợp lý.",
      "Chịu được áp lực công việc theo mùa vụ xuất hàng cao điểm."
    ]
  },
  {
    title: "Purchasing Executive",
    vn: "Nhân viên Thu mua",
    dept: "Kho vận & Chuỗi cung ứng",
    level: "Specialist",
    report: "Head of Production Planning",
    urgent: true,
    color: "#5C6BC0",
    status: "active",
    deadline: "2026-09-15",
    quantity: 1,
    ageRange: "24 - 34",
    gender: "Không yêu cầu",
    experienceText: "2+ năm thu mua nguyên vật liệu sản xuất",
    industry: "Thu mua · Chuỗi cung ứng",
    publishedAt: "2026-08-08",
    summary: "Tìm kiếm, đàm phán và đặt hàng nguyên vật liệu, vật tư phục vụ sản xuất, đảm bảo giá cả và tiến độ giao hàng tối ưu.",
    reqs: [
      "2+ năm kinh nghiệm thu mua nguyên vật liệu, ưu tiên ngành nhựa/sản xuất.",
      "Kỹ năng đàm phán giá, so sánh nhà cung cấp và quản lý hợp đồng cơ bản.",
      "Thành thạo Excel, quen lập kế hoạch mua hàng theo nhu cầu sản xuất.",
      "Trung thực, cẩn thận trong quản lý chi phí và hồ sơ mua hàng."
    ],
    responsibilities: [
      "Lập kế hoạch mua hàng dựa trên nhu cầu sản xuất và tồn kho hiện có.",
      "Tìm kiếm, đánh giá và đàm phán với nhà cung cấp về giá cả, chất lượng, tiến độ.",
      "Theo dõi tiến độ giao hàng, phối hợp kho kiểm tra hàng nhập đúng yêu cầu.",
      "Cập nhật hồ sơ nhà cung cấp, hợp đồng và biến động giá nguyên vật liệu.",
      "Báo cáo tình hình mua hàng, chi phí và đề xuất tối ưu nguồn cung."
    ],
    requirementsDetail: [
      "Tốt nghiệp Cao đẳng/Đại học chuyên ngành Kinh doanh, Logistics hoặc liên quan.",
      "Có kinh nghiệm thu mua nguyên vật liệu trong doanh nghiệp sản xuất.",
      "Kỹ năng đàm phán, xây dựng quan hệ với nhà cung cấp.",
      "Cẩn thận, có trách nhiệm với chi phí và tiến độ mua hàng.",
      "Tiếng Anh giao tiếp cơ bản là lợi thế khi làm việc với nhà cung cấp nước ngoài."
    ]
  },
  {
    title: "General Accountant",
    vn: "Kế toán Tổng hợp",
    dept: "Tài chính - Kế toán",
    level: "Specialist",
    report: "Kế toán trưởng",
    urgent: false,
    color: "#9C27B0",
    status: "active",
    deadline: "2026-09-30",
    quantity: 1,
    ageRange: "24 - 34",
    gender: "Không yêu cầu",
    experienceText: "3+ năm kế toán tổng hợp, thành thạo phần mềm kế toán",
    industry: "Tài chính · Kế toán",
    publishedAt: "2026-08-08",
    summary: "Thực hiện công tác kế toán tổng hợp, hạch toán và lập báo cáo tài chính định kỳ, đảm bảo số liệu chính xác và đúng hạn.",
    reqs: [
      "3+ năm kinh nghiệm kế toán tổng hợp, ưu tiên doanh nghiệp sản xuất.",
      "Thành thạo phần mềm kế toán và Excel nâng cao.",
      "Am hiểu chuẩn mực kế toán Việt Nam và quy định thuế hiện hành.",
      "Cẩn thận, chính xác và có khả năng làm việc dưới áp lực deadline."
    ],
    responsibilities: [
      "Hạch toán các nghiệp vụ kế toán phát sinh hàng ngày theo đúng quy định.",
      "Lập báo cáo tài chính, báo cáo thuế định kỳ theo tháng/quý/năm.",
      "Đối chiếu công nợ, kiểm tra chứng từ và lưu trữ hồ sơ kế toán.",
      "Phối hợp kiểm toán, thuế trong các đợt kiểm tra, quyết toán.",
      "Hỗ trợ kế toán trưởng phân tích số liệu tài chính khi cần."
    ],
    requirementsDetail: [
      "Tốt nghiệp Đại học chuyên ngành Kế toán, Kiểm toán, Tài chính hoặc liên quan.",
      "Có kinh nghiệm làm kế toán tổng hợp thực tế tại doanh nghiệp sản xuất.",
      "Nắm vững chuẩn mực kế toán, luật thuế và quy trình quyết toán.",
      "Kỹ năng làm việc với số liệu lớn, tỉ mỉ và chính xác cao.",
      "Trung thực, bảo mật thông tin tài chính công ty."
    ]
  },
  {
    title: "Financial Analyst",
    vn: "Chuyên viên Phân tích Tài chính",
    dept: "Tài chính - Kế toán",
    level: "Specialist",
    report: "Kế toán trưởng",
    urgent: true,
    color: "#9C27B0",
    status: "active",
    deadline: "2026-09-15",
    quantity: 1,
    ageRange: "25 - 35",
    gender: "Không yêu cầu",
    experienceText: "3+ năm phân tích tài chính hoặc FP&A",
    industry: "Tài chính · Phân tích & Kế hoạch",
    publishedAt: "2026-08-08",
    summary: "Phân tích số liệu tài chính, xây dựng báo cáo quản trị và hỗ trợ Ban lãnh đạo ra quyết định dựa trên dữ liệu.",
    reqs: [
      "3+ năm kinh nghiệm phân tích tài chính, FP&A hoặc kiểm soát ngân sách.",
      "Thành thạo Excel nâng cao, có kinh nghiệm Power BI là lợi thế lớn.",
      "Tư duy phân tích tốt, khả năng diễn giải số liệu thành insight kinh doanh.",
      "Kỹ năng trình bày, làm việc với dữ liệu từ nhiều phòng ban."
    ],
    responsibilities: [
      "Thu thập, phân tích số liệu tài chính và hiệu quả kinh doanh định kỳ.",
      "Xây dựng báo cáo quản trị, dashboard hỗ trợ Ban lãnh đạo ra quyết định.",
      "Tham gia lập ngân sách, dự báo dòng tiền và kiểm soát chi phí.",
      "Phân tích hiệu quả đầu tư, chi phí sản xuất và đề xuất tối ưu.",
      "Phối hợp các phòng ban thu thập dữ liệu phục vụ phân tích chuyên sâu."
    ],
    requirementsDetail: [
      "Tốt nghiệp Đại học chuyên ngành Tài chính, Kế toán, Kinh tế hoặc liên quan.",
      "Có kinh nghiệm phân tích tài chính hoặc lập kế hoạch ngân sách thực tế.",
      "Thành thạo công cụ phân tích dữ liệu, mô hình hóa tài chính cơ bản.",
      "Tư duy logic, cẩn thận và có khả năng làm việc độc lập.",
      "Tiếng Anh đọc hiểu báo cáo tài chính là lợi thế."
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
    await db.query("TRUNCATE TABLE audit_logs");
    await db.query("TRUNCATE TABLE consent_logs");
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
