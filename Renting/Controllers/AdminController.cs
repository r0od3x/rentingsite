using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Renting.Models;
using Renting.Services;

namespace Renting.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    [Authorize(Roles = "admin")]
    public class AdminController : ControllerBase
    {
        private readonly MongoDbService _mongo;

        public AdminController(MongoDbService mongo)
        {
            _mongo = mongo;
        }

        [HttpGet("users")]
        public async Task<IActionResult> GetAllUsers()
        {
            var users = await _mongo.GetAllUsersAsync();
            var safeUsers = users.Select(u => new
            {
                id = u.Id,
                email = u.Email,
                role = u.Role,
                isBanned = u.IsBanned,
                createdAt = u.CreatedAt
            });
            return Ok(safeUsers);
        }

        [HttpPut("users/{id}/ban")]
        public async Task<IActionResult> BanUser(string id)
        {
            var user = await _mongo.GetUserByIdAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            if (user.Role == "admin")
                return BadRequest(new { message = "Cannot ban an admin" });

            await _mongo.BanUserAsync(id);
            return Ok(new { message = "User banned successfully" });
        }

        [HttpPut("users/{id}/unban")]
        public async Task<IActionResult> UnbanUser(string id)
        {
            var user = await _mongo.GetUserByIdAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            await _mongo.UnbanUserAsync(id);
            return Ok(new { message = "User unbanned successfully" });
        }

        [HttpDelete("users/{id}")]
        public async Task<IActionResult> DeleteUser(string id)
        {
            var user = await _mongo.GetUserByIdAsync(id);
            if (user == null)
                return NotFound(new { message = "User not found" });

            if (user.Role == "admin")
                return BadRequest(new { message = "Cannot delete an admin" });

            await _mongo.DeleteUserAsync(id);
            return Ok(new { message = "User deleted successfully" });
        }

        [HttpGet("properties")]
        public async Task<IActionResult> GetAllProperties()
        {
            var properties = await _mongo.GetAllPropertiesAsync();
            return Ok(properties);
        }

        [HttpPut("properties/{id}")]
        public async Task<IActionResult> UpdateProperty(string id, [FromBody] Property property)
        {
            if (id != property.Id)
                return BadRequest(new { message = "ID mismatch" });

            try
            {
                await _mongo.UpdatePropertyAsync(property);
                return Ok(new { message = "Property updated successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpDelete("properties/{id}")]
        public async Task<IActionResult> DeleteProperty(string id)
        {
            try
            {
                await _mongo.DeletePropertyAsync(id);
                return Ok(new { message = "Property deleted successfully" });
            }
            catch (Exception ex)
            {
                return BadRequest(new { message = ex.Message });
            }
        }

        [HttpGet("rentals")]
        public async Task<IActionResult> GetAllRentals()
        {
            var rentals = await _mongo.GetAllRentalsAsync();
            return Ok(rentals);
        }

        [HttpGet("stats")]
        public async Task<IActionResult> GetStats()
        {
            var users = await _mongo.GetAllUsersAsync();
            var properties = await _mongo.GetAllPropertiesAsync();
            var rentals = await _mongo.GetAllRentalsAsync();

            return Ok(new
            {
                totalUsers = users.Count,
                bannedUsers = users.Count(u => u.IsBanned),
                totalProperties = properties.Count,
                totalRentals = rentals.Count
            });
        }
    }
}
