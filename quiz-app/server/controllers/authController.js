export const verifyPin = async (req, res, next) => {
    const { pin } = req.body;
    const correctPin = process.env.PIN_CODE;

    if (pin === correctPin) {
        res.status(200).json({ success: true, message: "PIN verified successfully" });
    } else {
        res.status(401).json({ success: false, message: "Incorrect PIN" });
    }
};