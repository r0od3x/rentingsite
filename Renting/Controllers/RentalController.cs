using Microsoft.AspNetCore.Mvc;
using Renting.Models;
using Renting.Services;

namespace Renting.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class RentalController : ControllerBase
    {
        private readonly MongoDbService _mongo;

        public RentalController(MongoDbService mongo)
        {
            _mongo = mongo;
        }

        [HttpPost("rent")]
        public async Task<IActionResult> RentProperty([FromBody] Rental rental)
        {
            if (rental == null)
                return BadRequest(new { message = "Rental data is missing" });

            if (string.IsNullOrEmpty(rental.PropertyId) ||
                string.IsNullOrEmpty(rental.RenterEmail) ||
                string.IsNullOrEmpty(rental.SellerEmail))
            {
                return BadRequest(new { message = "Missing required rental fields" });
            }

            rental.Id = null; // Ensure Mongo generates a new ID

            try
            {
                // 1️⃣ Add rental to DB
                await _mongo.AddRentalAsync(rental);


                // 2️⃣ Fetch the property name for the notification
                var property = await _mongo.GetPropertyByIdAsync(rental.PropertyId);
                var propertyName = property?.Description ?? "Your property";

                // 3️⃣ Create a new notification
                var notification = new Notification
                {
                    Id = null, // Mongo will generate
                    Date = DateTime.Now.ToString("yyyy-MM-dd HH:mm:ss"),
                    Text = $"Your property \"{propertyName}\" has been rented from {rental.StartTime:yyyy-MM-dd} to {rental.EndTime:yyyy-MM-dd}.",
                    SellerEmail = rental.SellerEmail
                };

                // 4️⃣ Add notification to DB
                await _mongo.AddNotificationAsync(notification);

                return Ok(new { message = "Property rented successfully and notification sent." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("renter/{email}")]
        public async Task<IActionResult> GetRentalsByRenter(string email)
        {
            var rentals = await _mongo.GetRentalsByRenterAsync(email);
            return Ok(rentals);
        }
    }
}
