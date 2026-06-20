import { Router, type IRouter } from "express";
import healthRouter from "./health.js";
import userRouter from "./user.js";
import creditsRouter from "./credits.js";
import quizzesRouter from "./quizzes.js";
import flashcardsRouter from "./flashcards.js";
import summaryRouter from "./summary.js";
import paystackRouter from "./paystack.js";
import chatRouter from "./chat.js";

const router: IRouter = Router();

router.use(healthRouter);
router.use(userRouter);
router.use(creditsRouter);
router.use(quizzesRouter);
router.use(flashcardsRouter);
router.use(summaryRouter);
router.use(paystackRouter);
router.use(chatRouter);

export default router;
