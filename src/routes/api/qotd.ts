import express from "express";

import Qotd from "../../models/Qotd.schema";

const router = express.Router();

/**
 * @openapi
 * /qotd:
 *    get:
 *      tags:
 *        - /
 *      summary: gets a question of the day
 *      responses:
 *        302:
 *          description: Found (Redirect to /random)
 */
router.get("/", (req, res) => {
  res.redirect("/qotd/random");
});

/**
 * @openapi
 * /qotd/random:
 *    get:
 *      tags:
 *        - /
 *      summary: Fetch a random question of the day
 *      produces: application/json
 *      responses:
 *        200:
 *          description: Successful Response
 *          schema:
 *            type: "object"
 *            properties:
 *              id:
 *                type: string
 *              qotd:
 *                type: string
 */
router.get("/random", async (req, res) => {
  const targetRecord = await Qotd.aggregate([{ $sample: { size: 1 } }]);
  res.send(targetRecord[0]);
});

// filtered route, where a user can pass all the ids they want to exclude

router.get("/filtered", async (req, res) => {
  const body = req.body;
  const ids = body.ids;

  if (!ids) {
    return res.status(400).send("No ids provided");
  }

  const targetRecord = await Qotd.aggregate([
    { $match: { id: { $nin: ids } } },
    { $sample: { size: 1 } },
  ]);

  if (!targetRecord.length) {
    return res.status(404).send("No records found");
  }

  res.send({
    id: targetRecord[0].id,
    qotd: targetRecord[0].qotd,
  });
});

export default router;
