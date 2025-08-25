// src/modules/auth/auth.service.ts
import { prisma } from "../../server.js";
import bcrypt from "bcryptjs";
import jwt, { type Secret, type SignOptions } from "jsonwebtoken";
import { z } from "zod";
import { registerBodySchema } from "./dto/register.dto.js";
import { loginBodySchema } from "./dto/login.dto.js";
import { randomBytes } from "crypto";
import dayjs from "dayjs";
import { env } from "../../env/index.js";

type RegisterRequest = z.infer<typeof registerBodySchema>;
type LoginRequest = z.infer<typeof loginBodySchema>;

interface ITokenPayload {
  role: string;
  email: string;
}

export class AuthService {
  async register({ name, email, password }: RegisterRequest) {
    const userWithSameEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (userWithSameEmail) throw new Error("E-mail já cadastrado.");

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { name, email, passwordHash },
    });
    return { user };
  }

  async login({ email, password }: LoginRequest) {
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) throw new Error("Credenciais inválidas.");

    const isPasswordCorrect = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordCorrect) throw new Error("Credenciais inválidas.");

    const payload: ITokenPayload = {
      role: user.role,
      email: user.email,
    };

    const secret: Secret = env.JWT_SECRET;
    const signOptions: SignOptions = {
      subject: String(user.id),
      expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
      algorithm: "HS256",
    };

    const accessToken = jwt.sign(payload, secret, signOptions);

    // zera refresh tokens antigos do usuário (opcional/segurança)
    await prisma.refreshToken.deleteMany({ where: { userId: user.id } });

    const refreshToken = await prisma.refreshToken.create({
      data: {
        userId: user.id,
        // use o valor do env para a expiração do refresh
        expiresAt: dayjs().add( // se quiser usar REFRESH_TOKEN_EXPIRES_IN, pode parsear
          typeof env.REFRESH_TOKEN_EXPIRES_IN === "number" ? env.REFRESH_TOKEN_EXPIRES_IN : 7,
          "day"
        ).toDate(),
        token: randomBytes(40).toString("hex"),
      },
    });

    return { user, accessToken, refreshToken: refreshToken.token };
  }

  async refreshToken(token: string) {
    const refreshToken = await prisma.refreshToken.findUnique({
      where: { token },
    });
    if (!refreshToken) throw new Error("Refresh token inválido.");

    const isExpired = dayjs().isAfter(dayjs(refreshToken.expiresAt));
    if (isExpired) {
      throw new Error("Refresh token expirado. Por favor, faça login novamente.");
    }

    const user = await prisma.user.findUniqueOrThrow({
      where: { id: refreshToken.userId },
    });

    const payload: ITokenPayload = {
      role: user.role,
      email: user.email,
    };

    const secret: Secret = env.JWT_SECRET;
    const signOptions: SignOptions = {
      subject: String(user.id),
      expiresIn: env.ACCESS_TOKEN_EXPIRES_IN as SignOptions["expiresIn"],
      algorithm: "HS256",
    };

    const newAccessToken = jwt.sign(payload, secret, signOptions);

    return { accessToken: newAccessToken };
  }
}
