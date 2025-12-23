using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Text.Json.Serialization;

namespace Renting.Models
{
    public class Rental
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        [JsonPropertyName("propertyId")]
        public string PropertyId { get; set; }

        [JsonPropertyName("renterEmail")]
        public string RenterEmail { get; set; }

        [JsonPropertyName("sellerEmail")]
        public string SellerEmail { get; set; }

        [JsonPropertyName("startTime")]
        public DateTime StartTime { get; set; }

        [JsonPropertyName("endTime")]
        public DateTime EndTime { get; set; }

        [JsonPropertyName("numberOfPeople")]
        public int NumberOfPeople { get; set; }

        [JsonPropertyName("totalPrice")]
        public double TotalPrice { get; set; }
    }
}
