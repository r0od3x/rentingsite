using MongoDB.Driver;
using Renting.Models;

namespace Renting.Services
{
    public class MongoDbService
    {
        private readonly IMongoCollection<User> _users;
        private readonly IMongoCollection<Property> _properties;
        private readonly IMongoCollection<Rental> _rentals;


        public MongoDbService(IConfiguration config)
        {
            var client = new MongoClient(config["MongoDb:ConnectionString"]);
            var database = client.GetDatabase(config["MongoDb:Database"]);
            _users = database.GetCollection<User>("Users");
            _properties = database.GetCollection<Property>("Properties");
            _rentals = database.GetCollection<Rental>("Rentals");

        }

        // Users
        public async Task AddUserAsync(User user)
        {
            await _users.InsertOneAsync(user);
        }

        public async Task<User> GetUserByEmailAsync(string email)
        {
            return await _users.Find(u => u.Email == email).FirstOrDefaultAsync();
        }

        // Properties
        public async Task AddPropertyAsync(Property property)
        {
            await _properties.InsertOneAsync(property);
        }

        public async Task<List<Property>> GetAllPropertiesAsync()
        {
            return await _properties.Find(_ => true).ToListAsync();
        }

        public async Task<Property> GetPropertyByIdAsync(string id)
        {
            return await _properties.Find(p => p.Id == id).FirstOrDefaultAsync();
        }

        public async Task UpdatePropertyAsync(Property property)
        {
            var result = await _properties.ReplaceOneAsync(
                p => p.Id == property.Id,
                property
            );

            if (result.MatchedCount == 0)
                throw new Exception("Update failed: property not found");
        }

        public async Task DeletePropertyAsync(string id)
        {
            var result = await _properties.DeleteOneAsync(p => p.Id == id);

            if (result.DeletedCount == 0)
                throw new Exception("Delete failed: property not found");
        }

        // Rentals
        public async Task AddRentalAsync(Rental rental)
        {
            await _rentals.InsertOneAsync(rental);
        }

        public async Task<List<Rental>> GetRentalsByRenterAsync(string email)
        {
            return await _rentals.Find(r => r.RenterEmail == email).ToListAsync();
        }


    }
}
