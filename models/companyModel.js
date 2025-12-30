const pool = require("../config/databasepg");

const createCompany = async (data) => {
  const query = `
    INSERT INTO companies
    (company_name, company_code, email, contact_number, photo_url, role, address, description, terms_agreed)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
    RETURNING *
  `;

  const values = [
    data.companyName,
    data.companycode,
    data.email,
    data.contactNumber,
    data.photoUrl,
    data.role,
    data.address,
    data.description,
    data.termsAgreed,
  ];

  return pool.query(query, values);
};

module.exports = { createCompany };
