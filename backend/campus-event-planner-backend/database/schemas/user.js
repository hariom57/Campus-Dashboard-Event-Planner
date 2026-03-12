const createUsersTable = async (sql) => {
    await sql`
        CREATE TABLE IF NOT EXISTS "user" (
            user_id BIGINT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            email VARCHAR(255) UNIQUE NOT NULL,
            phone_number VARCHAR(20),
            display_picture TEXT,
            enrolment_number VARCHAR(255) UNIQUE,
            branch VARCHAR(255),
            current_year INTEGER,
            branch_department_name VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
    `;

    await sql`CREATE INDEX IF NOT EXISTS idx_user_email ON "user"(email);`;
    await sql`CREATE INDEX IF NOT EXISTS idx_user_enrolment_number ON "user"(enrolment_number);`;
};

module.exports = createUsersTable;
