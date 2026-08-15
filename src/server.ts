import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import swaggerJsdoc from "swagger-jsdoc";
import rateLimit from "express-rate-limit";
import { v1Router } from "./routes/v1";
import { errorHandler } from "./middleware/error.middleware";

const app = express();

app.use(helmet());
const corsOptions = {
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  optionsSuccessStatus: 200,
  credentials: true
};

app.use(cors(corsOptions));

// Global rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});
app.use(limiter);

app.use(morgan("dev"));
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// Swagger setup
const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "CarbonSynq UMS API",
      version: "1.0.0",
      description: "API documentation for CarbonSynq University Management System",
    },
    servers: [
      {
        url: "http://localhost:5000/api/v1",
      },
    ],
  },
  apis: ["./src/routes/v1/*.ts", "./src/modules/**/*.routes.ts"], 
};

const swaggerSpec = swaggerJsdoc(options);
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

app.use("/api/v1", v1Router);

app.get("/health", (req, res) => {
  res.status(200).json({ 
    status: "ok", 
    service: "CarbonSynq UMS Backend", 
    database: "connected" 
  });
});

// Global Error Handler
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
      console.log(`Swagger Docs available at http://localhost:${PORT}/api/docs`);
    });
}

export default app;