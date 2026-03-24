const {PrismaClient} = require("../generated/prisma");
const {PrismaPg} = require("@prisma/adapter-pg");

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL,
});

const prisma = new PrismaClient({adapter});


const createNewUser = async (username, password, isBlogger) => {
    return prisma.user.create({
        data: {
            username,
            password,
            isBlogger
        }
    })
}

const getUserfromId = async (userId) => {
    return prisma.user.findUnique({
        where: {id: userId}
    });
}

const getUserFromUsername = async (username) => {
    return prisma.user.findUnique(
        {
            where: {username}
        }
    );
}


module.exports = {
    createNewUser,
    getUserfromId,
    getUserFromUsername,
    prisma
}