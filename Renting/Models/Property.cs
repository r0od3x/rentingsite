using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

public class Property
{
    [BsonId]
    [BsonRepresentation(BsonType.ObjectId)]
    public string Id { get; set; }

    [JsonPropertyName("description")]
    public string Description { get; set; }

    [JsonPropertyName("maxPerson")]
    public int MaxPerson { get; set; }

    [JsonPropertyName("propertyType")]
    public string PropertyType { get; set; }

    [JsonPropertyName("pricePerNight")]
    public double PricePerNight { get; set; }

    [JsonPropertyName("sellerEmail")]
    public string SellerEmail { get; set; }

    [JsonPropertyName("rentalStatus")]
    public string RentalStatus { get; set; } = "Available";
}
