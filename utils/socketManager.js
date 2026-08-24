const userSocketMap = new Map();

const addUserSocket = (userId, socketId) => {

    userSocketMap.set(
        userId.toString(),
        socketId
    );

};

const removeUserSocket = (socketId) => {

    for (
        const [userId, storedSocketId]
        of userSocketMap.entries()
    ) {

        if (storedSocketId === socketId) {

            userSocketMap.delete(userId);

            break;

        }

    }

};

const getUserSocket = (userId) => {

    return userSocketMap.get(
        userId.toString()
    );

};

module.exports = {
    addUserSocket,
    removeUserSocket,
    getUserSocket
};