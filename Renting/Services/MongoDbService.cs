using MongoDB.Driver;
using Renting.Models;

namespace Renting.Services
{
    public class MongoDbService
    {
        private readonly IMongoCollection<User> _users;
        private readonly IMongoCollection<Property> _properties;
        private readonly IMongoCollection<Rental> _rentals;
        private readonly IMongoCollection<Notification> _notifications;
        private readonly IMongoCollection<Review> _reviews;
        private readonly IMongoCollection<PropertyImage> _propertyImages;



        public MongoDbService(IConfiguration config)
        {
            var client = new MongoClient(config["MongoDb:ConnectionString"]);
            var database = client.GetDatabase(config["MongoDb:Database"]);
            _users = database.GetCollection<User>("Users");
            _properties = database.GetCollection<Property>("Properties");
            _rentals = database.GetCollection<Rental>("Rentals");
            _notifications = database.GetCollection<Notification>("Notifications");
            _reviews = database.GetCollection<Review>("Reviews");
            _propertyImages = database.GetCollection<PropertyImage>("PropertyImages");




            MigrateUsersAsync().Wait();
            SeedAdminAsync().Wait();
        }

        private async Task MigrateUsersAsync()
        {
            var filter = Builders<User>.Filter.Or(
                Builders<User>.Filter.Exists(u => u.Role, false),
                Builders<User>.Filter.Eq(u => u.Role, null)
            );

            var update = Builders<User>.Update
                .Set(u => u.Role, "user")
                .Set(u => u.IsBanned, false)
                .Set(u => u.CreatedAt, DateTime.UtcNow);

            await _users.UpdateManyAsync(filter, update);
        }

        private async Task SeedAdminAsync()
        {
            var admin = await _users.Find(u => u.Email == "admin@renting.com").FirstOrDefaultAsync();
            if (admin == null)
            {
                await _users.InsertOneAsync(new User
                {
                    Email = "admin@renting.com",
                    Password = "admin123",
                    Role = "admin",
                    IsBanned = false,
                    CreatedAt = DateTime.UtcNow
                });
            }
        }

        public async Task AddUserAsync(User user)
        {
            await _users.InsertOneAsync(user);
        }

        public async Task<User> GetUserByEmailAsync(string email)
        {
            return await _users.Find(u => u.Email == email).FirstOrDefaultAsync();
        }

        public async Task<List<User>> GetAllUsersAsync()
        {
            return await _users.Find(_ => true).ToListAsync();
        }

        public async Task<User> GetUserByIdAsync(string id)
        {
            return await _users.Find(u => u.Id == id).FirstOrDefaultAsync();
        }

        public async Task DeleteUserAsync(string id)
        {
            await _users.DeleteOneAsync(u => u.Id == id);
        }

        public async Task BanUserAsync(string id)
        {
            var update = Builders<User>.Update.Set(u => u.IsBanned, true);
            await _users.UpdateOneAsync(u => u.Id == id, update);
        }

        public async Task UnbanUserAsync(string id)
        {
            var update = Builders<User>.Update.Set(u => u.IsBanned, false);
            await _users.UpdateOneAsync(u => u.Id == id, update);
        }

        public async Task AddPropertyAsync(Property property)
        {
            await _properties.InsertOneAsync(property);
        }

        public async Task<List<Property>> GetAllPropertiesAsync()
        {
            return await _properties.Find(_ => true).ToListAsync();
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

        public async Task AddRentalAsync(Rental rental)
        {

            if (rental.RenterEmail == rental.SellerEmail)
                throw new ArgumentException("Renter and seller cannot be the same user");

            
               
            await _rentals.InsertOneAsync(rental);
        }

        public async Task<List<Rental>> GetRentalsByRenterAsync(string email)
        {
            return await _rentals.Find(r => r.RenterEmail == email).ToListAsync();
        }

        public async Task<List<Rental>> GetAllRentalsAsync()
        {
            return await _rentals.Find(_ => true).ToListAsync();
        }

        public async Task AddNotificationAsync(Notification notification)
        {
            await _notifications.InsertOneAsync(notification);
        }
        public async Task<Property?> GetPropertyByIdAsync(string id)
        {
            return await _properties
                .Find(p => p.Id == id)
                .FirstOrDefaultAsync();
        }
        public async Task<List<Notification>> GetNotificationsBySellerAsync(string email)
        {
            return await _notifications
                .Find(n => n.SellerEmail == email)
                .SortByDescending(n => n.Date)
                .ToListAsync();
        }
        public async Task AddReviewAsync(Review review)
        {
            await _reviews.InsertOneAsync(review);
        }

        public async Task<List<Review>> GetReviewsByPropertyAsync(string propertyId)
        {
            return await _reviews.Find(r => r.PropertyId == propertyId).ToListAsync();
        }

        public async Task<bool> HasUserRentedProperty(string renterEmail, string propertyId)
        {
            return await _rentals.Find(r =>
                r.RenterEmail == renterEmail &&
                r.PropertyId == propertyId
            ).AnyAsync();
        }

        public async Task AddPropertyImageAsync(PropertyImage image)
        {
            await _propertyImages.InsertOneAsync(image);
        }

        public async Task<List<PropertyImage>> GetImagesByPropertyAsync(string propertyId)
        {
            return await _propertyImages
                .Find(i => i.PropertyId == propertyId)
                .ToListAsync();
        }

        public async Task<List<Review>> GetAllReviewsAsync()
        {
            return await _reviews.Find(_ => true).ToListAsync();
        }



    }
}
