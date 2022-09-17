import express from "express";
import { isAdminOrAccessingOwnData } from "../../middleware/isAdminOrAccessingOwnData";
import { MetricsModel } from "../../models/Metrics";
import getHistory from "../../utils/getHistory";
import { getLocationDetails } from "../../utils/getLocationDetails";

const router = express.Router();

router.get(
  "/location/:userId",
  isAdminOrAccessingOwnData,
  async (req: any, res: any) => {
    const latestLocation = getLocationDetails(req.ipinfo);
    return res.status(200).json(latestLocation);
  }
);

router.get(
  "/usage/:userId",
  isAdminOrAccessingOwnData,
  async (req: any, res) => {
    const queryResult = await MetricsModel.aggregate([
      {
        $match: { id: req.user.userId },
      },
    ])
      .sortByCount("urlAccessed")
      .exec();

    let totalApiCalls = 0;
    const response = queryResult.map((entity) => {
      totalApiCalls += entity.count;
      return {
        url: entity._id,
        count: entity.count,
      };
    });

    return res.status(200).json({
      apiUsageInfo: response,
      totalApiCalls: totalApiCalls,
    });
  }
);

router.get(
  "/history/:userId",
  isAdminOrAccessingOwnData,
  async (req: any, res) => {
    const fromDateISO: string =
      req.query.fromDate?.toString() ?? new Date().toISOString();
    const fromDate = new Date(fromDateISO);
    const limit = Math.min((req.query.limit ?? 10) as number, 10);
    const queryResult = await MetricsModel.find({
      id: req.user.userId,
      dateCreated: { $lt: fromDate },
    }).limit(limit);

    const history = queryResult.map(getHistory);

    return res.status(200).json({
      history: history,
    });
  }
);

export default router;
