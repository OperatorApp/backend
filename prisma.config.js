import "dotenv/config";

export default {
    schema: "models/schema.prisma",
    migrations: {
        path: "prisma/migrations",
    },
    datasource: {
        url: process.env.DATABASE_URL,
    },
};