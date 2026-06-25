import jwt from "jsonwebtoken";

export const verifyToken = (req, res, next) => {
  const token = req.headers["authorization"];
  if (!token) return res.status(403).json({ error: "Token requerido" });

  try {
    // Agregamos el respaldo string idéntico al que tiene tu Login para asegurar el descifrado
    const decoded = jwt.verify(
      token.split(" ")[1], 
      process.env.JWT_SECRET || 'clave_secreta_gestock'
    );
    
    req.user = decoded;
    next();
  } catch (error) {
    res.status(401).json({ error: "Token inválido o expirado" });
  }
};
