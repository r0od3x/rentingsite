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
            if (string.IsNullOrWhiteSpace(user.Email) || string.IsNullOrWhiteSpace(user.Password))
                return BadRequest(new { message = "Email and password are required" });

            var existing = await _mongo.GetUserByEmailAsync(user.Email);
            if (existing != null)
                return BadRequest(new { message = "Email already exists" });

            // Never trust role/ban flags coming from the client.
            var newUser = new User
            {
                Email = user.Email.Trim(),
                Password = BCrypt.Net.BCrypt.HashPassword(user.Password),
                Role = "user",
                IsBanned = false,
                CreatedAt = DateTime.UtcNow
            };

            await _mongo.AddUserAsync(newUser);
            return Ok(new { message = "User registered successfully" });
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] User loginUser)
        {
            var user = await _mongo.GetUserByEmailAsync(loginUser.Email);
            if (user == null || !await VerifyPasswordAsync(user, loginUser.Password))
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
                expires: DateTime.UtcNow.AddHours(_config.GetValue("Jwt:ExpiryHours", 1)),
                signingCredentials: creds
            );

            return Ok(new { 
                token = new JwtSecurityTokenHandler().WriteToken(token), 
                email = user.Email,
                role = user.Role
            });
        }

        private async Task<bool> VerifyPasswordAsync(User user, string password)
        {
            if (string.IsNullOrEmpty(password))
                return false;

            if (user.Password.StartsWith("$2"))
                return BCrypt.Net.BCrypt.Verify(password, user.Password);

            // Legacy account stored in plain text: accept once, then upgrade to a hash.
            if (user.Password != password)
                return false;

            if (user.Id != null)
                await _mongo.UpdateUserPasswordAsync(user.Id, BCrypt.Net.BCrypt.HashPassword(password));
            return true;
        }
    }
}
