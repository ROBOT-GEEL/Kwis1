export const getJetsonIp = async (req, res, next) => {
  res.json(process.env.PROJECTOR_RECEIVER_IP);
};

export const getZoneConfigPort = async (req, res, next) => {
  res.json(process.env.ZONE_CONFIG_PORT);
};