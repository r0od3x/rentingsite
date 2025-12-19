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

        // Rent a property
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

            // Important: ensure Id is null so MongoDB generates it
            rental.Id = null;

            try
            {
                await _mongo.AddRentalAsync(rental);
                return Ok(new { message = "Property rented successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        // Optional: get all rentals for a renter
        [HttpGet("renter/{email}")]
        public async Task<IActionResult> GetRentalsByRenter(string email)
        {
            var rentals = await _mongo.GetRentalsByRenterAsync(email);
            return Ok(rentals);
        }
    }
}
