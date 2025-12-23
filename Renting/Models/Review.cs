using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Text.Json.Serialization;

namespace Renting.Models
{
    public class Review
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string? RentalId { get; set; }
        public string? PropertyId { get; set; }

        public int Rating { get; set; }
        public string? Text { get; set; }

        public string? RenterEmail { get; set; }
        public DateTime CreatedAt { get; set; }
    }

}
