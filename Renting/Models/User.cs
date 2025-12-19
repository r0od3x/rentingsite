using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace Renting.Models
{
    public class User
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string? Id { get; set; }

        public string Email { get; set; } = null!;
        public string Password { get; set; } = null!;
    }
}
