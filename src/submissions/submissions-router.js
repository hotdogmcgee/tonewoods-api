    
const express = require('express')
const path = require('path')
const SubmissionsService = require('./submissions-service')
const { requireAuth } = require('../middleware/jwt-auth')

const submissionsRouter = express.Router()
const jsonBodyParser = express.json()

//get all
submissionsRouter
    .route('/')
    .get((req, res, next) => {
      SubmissionsService.getAllSubmissions(req.app.get('db'))
      .then(subs => {
        res.json(SubmissionsService.serializeSubmissions(subs))

      })
      .catch(next)
    })
submissionsRouter
  .route('/')
  .post(requireAuth, jsonBodyParser, (req, res, next) => {
    //variables on diff lines
    const { tw_id, user_id, density, e_long, e_cross, velocity_sound_long, radiation_ratio, sample_length, sample_width, sample_thickness, sample_weight_grams, peak_hz_long_grain, peak_hz_cross_grain, comments } = req.body
    const newSubmission = { tw_id, user_id, density, e_long, e_cross, velocity_sound_long, radiation_ratio, sample_length, sample_width, sample_thickness, sample_weight_grams, peak_hz_long_grain, peak_hz_cross_grain, comments }

    for (const [key, value] of Object.entries(newSubmission))
      if (value == null)
        return res.status(400).json({
          error: `Missing '${key}' in request body`
        })

    newSubmission.user_id = req.user.id

    SubmissionsService.insertSubmission(
      req.app.get('db'),
      newSubmission
    )
      .then(submission => {
        res
          .status(201)
          .location(path.posix.join(req.originalUrl, `/${submission.id}`))
          .json(SubmissionsService.serializeSubmission(submission))
      })
      .catch(next)
    })

    submissionsRouter
    .route('/:submission_id')
    .all(requireAuth)
    .all(checkSubmissionExists)
    .get(requireAuth, (req, res) => {
      res.json(SubmissionsService.serializeSubmission(res.submission))
    })

    //filter submissions by user. get all. map over based on user

/* async/await syntax for promises */
async function checkSubmissionExists(req, res, next) {
  try {
    const submission = await SubmissionsService.getById(
      req.app.get('db'),
      req.params.submission_id
    )

    if (!submission)
      return res.status(404).json({
        error: `Submission doesn't exist`
      })

    res.submission = submission
    next()
  } catch (error) {
    next(error)
  }
}

module.exports = submissionsRouter