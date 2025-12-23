using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using Renting.Models;
using Renting.Services;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace Renting.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController : ControllerBase
    {
        private readonly MongoDbService _mongo;
        private readonly IConfiguration _config;

        public AuthController(MongoDbService mongo, IConfiguration config)
        {
            _mongo = mongo;
            _config = config;
        }

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] User user)
        {
            var existing = await _mongo.GetUserByEmailAsync(user.Email);
            if (existing != null)
                return BadRequest(new { message = "Email already exists" });

            await _mongo.AddUserAsync(user);
            return Ok(new { message = "User registered successfully" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] User loginUser)
        {
            var user = await _mongo.GetUserByEmailAsync(loginUser.Email);
            if (user == null || user.Password != loginUser.Password)
                return BadRequest(new { message = "Invalid credentials" });

            // Check if user is banned
            if (user.IsBanned)
                return BadRequest(new { message = "Your account has been banned. Contact support." });

            var claims = new[] { 
                new Claim(ClaimTypes.Email, user.Email),
                new Claim(ClaimTypes.Role, user.Role),
                new Claim("userId", user.Id ?? "")
            };
            var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(_config["Jwt:Key"] ?? ""));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );

            return Ok(new { 
                token = new JwtSecurityTokenHandler().WriteToken(token), 
                email = user.Email,
                role = user.Role
            });
        }
    }
}
