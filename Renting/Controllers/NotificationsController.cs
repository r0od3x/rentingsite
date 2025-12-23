using Microsoft.AspNetCore.Mvc;
using Renting.Services;

namespace Renting.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotificationsController : ControllerBase
    {
        private readonly MongoDbService _mongo;

        public NotificationsController(MongoDbService mongo)
        {
            _mongo = mongo;
        }

        // GET api/notifications/seller/{email}
        [HttpGet("seller/{email}")]
        public async Task<IActionResult> GetSellerNotifications(string email)
        {
            if (string.IsNullOrEmpty(email))
                return BadRequest("Email is required");

            var notifications = await _mongo.GetNotificationsBySellerAsync(email);
            return Ok(notifications);
        }
    }
}
