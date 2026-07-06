const db = require("../config/db");

const Job = {
  getAll: async () => {
    const [rows] = await db.query("SELECT * FROM jobs ORDER BY created_at DESC");
    return rows.map(normalizeJob);
  },

  getAllActive: async () => {
    const [rows] = await db.query("SELECT * FROM jobs WHERE status = ? ORDER BY created_at DESC", ["active"]);
    return rows.map(normalizeJob);
  },

  create: async (job) => {
    const normalized = normalizeJobPayload(job);
    const [result] = await db.query(
      `INSERT INTO jobs
        (title, vn, dept, level, report, urgent, color, reqs, slug, summary,
         employment_type, work_location, location_short, salary_text, deadline,
         quantity, age_range, gender, experience_text, industry, published_at,
         responsibilities, requirements_detail, benefits, environment_sections, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        normalized.title,
        normalized.vn,
        normalized.dept,
        normalized.level,
        normalized.report,
        normalized.urgent,
        normalized.color,
        JSON.stringify(normalized.reqs),
        normalized.slug,
        normalized.summary,
        normalized.employmentType,
        normalized.workLocation,
        normalized.locationShort,
        normalized.salaryText,
        normalized.deadline,
        normalized.quantity,
        normalized.ageRange,
        normalized.gender,
        normalized.experienceText,
        normalized.industry,
        normalized.publishedAt,
        JSON.stringify(normalized.responsibilities),
        JSON.stringify(normalized.requirementsDetail),
        JSON.stringify(normalized.benefits),
        JSON.stringify(normalized.environmentSections),
        normalized.status
      ]
    );

    return Job.getById(result.insertId);
  },

  getById: async (id) => {
    const [rows] = await db.query("SELECT * FROM jobs WHERE id = ?", [id]);
    return rows[0] ? normalizeJob(rows[0]) : null;
  },

  update: async (id, job) => {
    const normalized = normalizeJobPayload(job);
    await db.query(
      `UPDATE jobs
       SET title = ?,
           vn = ?,
           dept = ?,
           level = ?,
           report = ?,
           urgent = ?,
           color = ?,
           reqs = ?,
           slug = ?,
           summary = ?,
           employment_type = ?,
           work_location = ?,
           location_short = ?,
           salary_text = ?,
           deadline = ?,
           quantity = ?,
           age_range = ?,
           gender = ?,
           experience_text = ?,
           industry = ?,
           published_at = ?,
           responsibilities = ?,
           requirements_detail = ?,
           benefits = ?,
           environment_sections = ?,
           status = ?
       WHERE id = ?`,
      [
        normalized.title,
        normalized.vn,
        normalized.dept,
        normalized.level,
        normalized.report,
        normalized.urgent,
        normalized.color,
        JSON.stringify(normalized.reqs),
        normalized.slug,
        normalized.summary,
        normalized.employmentType,
        normalized.workLocation,
        normalized.locationShort,
        normalized.salaryText,
        normalized.deadline,
        normalized.quantity,
        normalized.ageRange,
        normalized.gender,
        normalized.experienceText,
        normalized.industry,
        normalized.publishedAt,
        JSON.stringify(normalized.responsibilities),
        JSON.stringify(normalized.requirementsDetail),
        JSON.stringify(normalized.benefits),
        JSON.stringify(normalized.environmentSections),
        normalized.status,
        id
      ]
    );

    return Job.getById(id);
  },

  remove: async (id) => {
    const [result] = await db.query("DELETE FROM jobs WHERE id = ?", [id]);
    return result.affectedRows > 0;
  }
};

function normalizeJob(row) {
  const reqs = parseList(row.reqs);
  const responsibilities = parseList(row.responsibilities);
  const requirementsDetail = parseList(row.requirements_detail);

  return {
    ...row,
    employmentType: row.employment_type || "Full-time",
    workLocation: row.work_location || "KCN Tân Tạo, Bình Tân, TP.HCM",
    locationShort: row.location_short || "TP.HCM",
    salaryText: row.salary_text || "Thỏa thuận theo năng lực",
    ageRange: row.age_range || "",
    experienceText: row.experience_text || "",
    publishedAt: row.published_at || row.created_at,
    responsibilities,
    requirementsDetail: requirementsDetail.length > 0 ? requirementsDetail : reqs,
    benefits: parseBenefits(row.benefits),
    environmentSections: parseEnvironmentSections(row.environment_sections),
    urgent: Boolean(row.urgent),
    quantity: Number(row.quantity || 1),
    reqs
  };
}

function parseRequirements(value) {
  return parseList(value);
}

function normalizeJobPayload(job) {
  return {
    title: String(job.title || "").trim(),
    vn: String(job.vn || "").trim(),
    dept: String(job.dept || "").trim(),
    level: String(job.level || "").trim(),
    report: String(job.report || "").trim(),
    urgent: job.urgent ? 1 : 0,
    color: job.color || "#2196F3",
    reqs: parseList(job.reqs),
    slug: emptyToNull(job.slug),
    summary: emptyToNull(job.summary),
    employmentType: String(job.employmentType || job.employment_type || "Full-time").trim(),
    workLocation: String(job.workLocation || job.work_location || "KCN Tân Tạo, Bình Tân, TP.HCM").trim(),
    locationShort: String(job.locationShort || job.location_short || "TP.HCM").trim(),
    salaryText: String(job.salaryText || job.salary_text || "Thỏa thuận theo năng lực").trim(),
    deadline: normalizeDate(job.deadline),
    quantity: Number(job.quantity || 1),
    ageRange: emptyToNull(job.ageRange || job.age_range),
    gender: emptyToNull(job.gender),
    experienceText: emptyToNull(job.experienceText || job.experience_text),
    industry: emptyToNull(job.industry),
    publishedAt: normalizeDate(job.publishedAt || job.published_at),
    responsibilities: parseList(job.responsibilities),
    requirementsDetail: parseList(job.requirementsDetail || job.requirements_detail),
    benefits: parseBenefits(job.benefits),
    environmentSections: parseEnvironmentSections(job.environmentSections || job.environment_sections),
    status: job.status || "active"
  };
}

function parseList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return String(value)
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function parseBenefits(value) {
  const items = parseStructuredList(value);
  return items
    .map((item) => {
      if (typeof item === "object" && item !== null) {
        return {
          icon: String(item.icon || "✓").trim() || "✓",
          text: String(item.text || "").trim()
        };
      }

      const [icon, ...textParts] = String(item).split("|");
      const text = textParts.length > 0 ? textParts.join("|").trim() : String(item).trim();
      return {
        icon: textParts.length > 0 ? icon.trim() || "✓" : "✓",
        text
      };
    })
    .filter((item) => item.text);
}

function parseEnvironmentSections(value) {
  const items = parseStructuredList(value);
  return items
    .map((item) => {
      if (typeof item === "object" && item !== null) {
        return {
          title: String(item.title || "").trim(),
          content: String(item.content || "").trim()
        };
      }

      const [title, ...contentParts] = String(item).split("|");
      return {
        title: title.trim(),
        content: contentParts.join("|").trim()
      };
    })
    .filter((item) => item.title && item.content);
}

function parseStructuredList(value) {
  if (Array.isArray(value)) return value;
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return String(value)
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
}

function emptyToNull(value) {
  const text = String(value || "").trim();
  return text || null;
}

function normalizeDate(value) {
  const text = String(value || "").trim();
  return /^\d{4}-\d{2}-\d{2}$/.test(text) ? text : null;
}

module.exports = Job;
