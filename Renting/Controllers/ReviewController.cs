using Microsoft.AspNetCore.Mvc;
using Renting.Models;
using Renting.Services;

namespace Renting.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ReviewController : ControllerBase
    {
        private readonly MongoDbService _mongo;

        public ReviewController(MongoDbService mongo)
        {
            _mongo = mongo;
        }

        // ============================
        // GET REVIEWS BY PROPERTY
        // ============================
        [HttpGet("property/{propertyId}")]
        public async Task<IActionResult> GetByProperty(string propertyId)
        {
            if (string.IsNullOrWhiteSpace(propertyId))
                return BadRequest(new { message = "Property ID is required" });

            var reviews = await _mongo.GetReviewsByPropertyAsync(propertyId);
            return Ok(reviews);
        }

        // ============================
        // ADD REVIEW
        // ============================
        [HttpPost("add")]
        public async Task<IActionResult> AddReview([FromBody] Review review)
        {
            // ---------- MODEL BINDING SAFETY ----------
            if (!ModelState.IsValid || review == null)
                return BadRequest(new { message = "Invalid review payload" });

            // ---------- REQUIRED FIELDS ----------
            if (string.IsNullOrWhiteSpace(review.PropertyId))
                return BadRequest(new { message = "PropertyId is required" });

            if (string.IsNullOrWhiteSpace(review.RenterEmail))
                return BadRequest(new { message = "RenterEmail is required" });

            if (string.IsNullOrWhiteSpace(review.Text))
                return BadRequest(new { message = "Review text is required" });

            // ---------- RATING VALIDATION ----------
            if (review.Rating < 0 || review.Rating > 5)
                return BadRequest(new { message = "Rating must be between 0 and 5" });

            // ---------- RENTAL CHECK ----------
            var hasRented = await _mongo.HasUserRentedProperty(
                review.RenterEmail,
                review.PropertyId
            );

            if (!hasRented)
                return BadRequest(new { message = "You must rent this property before reviewing" });

            // ---------- SERVER-CONTROLLED FIELDS ----------
            review.Id = null;
            review.CreatedAt = DateTime.UtcNow;

            // ---------- SAVE ----------
            await _mongo.AddReviewAsync(review);

            return Ok(new
            {
                message = "Review added successfully"
            });
        }
    }
}
