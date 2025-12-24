using Microsoft.AspNetCore.Mvc;
using Renting.Models;
using Renting.Services;

[ApiController]
[Route("api/image")]
public class ImageController : ControllerBase
{
    private readonly MongoDbService _mongo;

    public ImageController(MongoDbService mongo)
    {
        _mongo = mongo;
    }

    [HttpPost("upload")]
    public async Task<IActionResult> UploadImage([FromBody] UploadImageDto dto)
    {
        if (string.IsNullOrEmpty(dto.propertyId))
            return BadRequest(new { message = "PropertyId missing" });

        if (string.IsNullOrEmpty(dto.imageBase64))
            return BadRequest(new { message = "Image missing" });

        var image = new PropertyImage
        {
            Id = null,
            PropertyId = dto.propertyId,
            ImageBase64 = dto.imageBase64,
            CreatedAt = DateTime.UtcNow
        };

        await _mongo.AddPropertyImageAsync(image);

        return Ok(new { message = "Image uploaded" });
    }

    [HttpGet("property/{propertyId}")]
    public async Task<IActionResult> GetImages(string propertyId)
    {
        var images = await _mongo.GetImagesByPropertyAsync(propertyId);
        return Ok(images);
    }
}
