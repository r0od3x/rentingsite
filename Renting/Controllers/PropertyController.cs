using Microsoft.AspNetCore.Mvc;
using Renting.Models;
using Renting.Services;

[ApiController]
[Route("api/[controller]")]
public class PropertyController : ControllerBase
{
    private readonly MongoDbService _mongo;

    public PropertyController(MongoDbService mongo)
    {
        _mongo = mongo;
    }

    [HttpGet("seller/{email}")]
    public async Task<IActionResult> GetBySeller(string email)
    {
        var all = await _mongo.GetAllPropertiesAsync();
        var myProps = all.FindAll(p => p.SellerEmail == email);
        return Ok(myProps);
    }

    [HttpPost("add")]
    public async Task<IActionResult> AddProperty([FromBody] Property property)
    {
        if (property == null || string.IsNullOrWhiteSpace(property.Description) ||
            string.IsNullOrWhiteSpace(property.PropertyType) ||
            property.PricePerNight <= 0 || string.IsNullOrWhiteSpace(property.SellerEmail))
        {
            return BadRequest(new { message = "Invalid property data" });
        }

        property.Id = null; 
        await _mongo.AddPropertyAsync(property);
        return Ok(property);    
    }

    [HttpPut("{id}")]
    public async Task<IActionResult> EditProperty(string id, [FromBody] Property property)
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

    [HttpDelete("{id}")]
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
    [HttpGet]
    public async Task<IActionResult> GetAll()
    {
        var props = await _mongo.GetAllPropertiesAsync();
        return Ok(props);
    }
}
