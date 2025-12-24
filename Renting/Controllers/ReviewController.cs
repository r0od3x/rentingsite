using Microsoft.AspNetCore.Mvc;
using Renting.Models;
using Renting.Services;

[ApiController]
[Route("api/[controller]")]
public class ReviewController : ControllerBase
{
    private readonly MongoDbService _mongo;

    public ReviewController(MongoDbService mongo)
    {
        _mongo = mongo;
    }

    // ✅ GET ALL REVIEWS (USED FOR BEST RATED)
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var reviews = await _mongo.GetAllReviewsAsync();
        return Ok(reviews);
    }

    // ✅ GET REVIEWS FOR ONE PROPERTY
    [HttpGet("property/{propertyId}")]
    public async Task<IActionResult> GetByProperty(string propertyId)
    {
        var reviews = await _mongo.GetReviewsByPropertyAsync(propertyId);
        return Ok(reviews);
    }

    // ✅ ADD REVIEW (ONLY IF RENTED)
    [HttpPost("add")]
    public async Task<IActionResult> AddReview([FromBody] Review review)
    {
        if (review == null)
            return BadRequest(new { message = "Invalid review data" });

        if (review.Rating < 1 || review.Rating > 5)
            return BadRequest(new { message = "Rating must be between 1 and 5" });

        var hasRented = await _mongo.HasUserRentedProperty(
            review.RenterEmail,
            review.PropertyId
        );

        if (!hasRented)
            return BadRequest(new { message = "You must rent before reviewing" });

        review.Id = null;
        review.CreatedAt = DateTime.UtcNow;

        await _mongo.AddReviewAsync(review);
        return Ok(new { message = "Review added successfully" });
    }
}
