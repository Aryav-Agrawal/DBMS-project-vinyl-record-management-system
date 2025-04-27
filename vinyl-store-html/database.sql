-- Create the database
CREATE DATABASE IF NOT EXISTS vinyl_store;
USE vinyl_store;

-- Vinyl Records table with enhanced features
CREATE TABLE IF NOT EXISTS vinylrecords (
    RecordID INT AUTO_INCREMENT PRIMARY KEY,
    Title VARCHAR(255) NOT NULL,
    Artist VARCHAR(255) NOT NULL,
    Genre VARCHAR(100),
    ReleaseYear YEAR,
    `Condition` ENUM('New', 'Used - Like New', 'Used - Very Good', 'Used - Good', 'Used - Fair') NOT NULL,
    Price DECIMAL(10,2) NOT NULL,
    Stock INT NOT NULL DEFAULT 0,
    Format ENUM('LP', '45 RPM', '78 RPM', 'EP') NOT NULL DEFAULT 'LP',
    Label VARCHAR(100),
    CatalogNumber VARCHAR(50),
    Description TEXT,
    CoverImageURL VARCHAR(255),
    Weight INT COMMENT 'Weight in grams',
    Speed ENUM('33', '45', '78') DEFAULT '33',
    LastRestockDate TIMESTAMP,
    INDEX (Title),
    INDEX (Artist),
    INDEX (Genre),
    INDEX (Format),
    INDEX (Label)
);

-- Album Details table for additional record information
CREATE TABLE IF NOT EXISTS albumdetails (
    AlbumDetailID INT AUTO_INCREMENT PRIMARY KEY,
    RecordID INT NOT NULL,
    TrackNumber INT NOT NULL,
    TrackTitle VARCHAR(255) NOT NULL,
    Duration VARCHAR(8),
    Side ENUM('A', 'B', 'C', 'D') NOT NULL,
    FOREIGN KEY (RecordID) REFERENCES vinylrecords(RecordID) ON DELETE CASCADE,
    UNIQUE KEY (RecordID, TrackNumber, Side)
);

-- Users table with enhanced features
CREATE TABLE IF NOT EXISTS users (
    UserID INT AUTO_INCREMENT PRIMARY KEY,
    Username VARCHAR(50) NOT NULL UNIQUE,
    Email VARCHAR(100) NOT NULL UNIQUE,
    PasswordHash VARCHAR(255) NOT NULL,
    FirstName VARCHAR(50),
    LastName VARCHAR(50),
    Address TEXT,
    PhoneNumber VARCHAR(20),
    PreferredGenres JSON,
    NewsletterSubscription BOOLEAN DEFAULT FALSE,
    LastLoginDate TIMESTAMP,
    CreatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Status ENUM('Active', 'Inactive', 'Suspended') DEFAULT 'Active',
    INDEX (Email),
    INDEX (Status)
);

-- Orders table with improved tracking
CREATE TABLE IF NOT EXISTS orders (
    OrderID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    OrderDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    TotalAmount DECIMAL(10,2) NOT NULL,
    Status ENUM('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled') DEFAULT 'Pending',
    ShippingAddress TEXT NOT NULL,
    TrackingNumber VARCHAR(100),
    EstimatedDeliveryDate DATE,
    ShippingMethod VARCHAR(50),
    ShippingCost DECIMAL(6,2),
    Notes TEXT,
    FOREIGN KEY (UserID) REFERENCES users(UserID),
    INDEX (UserID),
    INDEX (OrderDate),
    INDEX (Status)
);

-- Order Details table
CREATE TABLE IF NOT EXISTS orderdetails (
    OrderDetailID INT AUTO_INCREMENT PRIMARY KEY,
    OrderID INT NOT NULL,
    RecordID INT NOT NULL,
    Quantity INT NOT NULL,
    Subtotal DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (OrderID) REFERENCES orders(OrderID),
    FOREIGN KEY (RecordID) REFERENCES vinylrecords(RecordID),
    INDEX (OrderID),
    INDEX (RecordID)
);

-- Transactions table with enhanced payment tracking
CREATE TABLE IF NOT EXISTS transactions (
    TransactionID INT AUTO_INCREMENT PRIMARY KEY,
    OrderID INT NOT NULL,
    PaymentMethod ENUM('Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer', 'Cash on Delivery', 'Cryptocurrency') NOT NULL,
    TransactionDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    Amount DECIMAL(10,2) NOT NULL,
    Currency CHAR(3) DEFAULT 'USD',
    Status ENUM('Pending', 'Completed', 'Failed', 'Refunded') DEFAULT 'Pending',
    PaymentReference VARCHAR(100),
    RefundReason TEXT,
    FOREIGN KEY (OrderID) REFERENCES orders(OrderID),
    INDEX (OrderID),
    INDEX (TransactionDate),
    INDEX (Status)
);

-- Reviews table with enhanced features
CREATE TABLE IF NOT EXISTS reviews (
    ReviewID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    RecordID INT NOT NULL,
    Rating INT NOT NULL CHECK (Rating BETWEEN 1 AND 5),
    Comment TEXT,
    SoundQualityRating INT CHECK (SoundQualityRating BETWEEN 1 AND 5),
    PackagingRating INT CHECK (PackagingRating BETWEEN 1 AND 5),
    ReviewDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    LastEditDate TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    Verified BOOLEAN DEFAULT FALSE,
    Helpful INT DEFAULT 0,
    NotHelpful INT DEFAULT 0,
    FOREIGN KEY (UserID) REFERENCES users(UserID),
    FOREIGN KEY (RecordID) REFERENCES vinylrecords(RecordID),
    INDEX (UserID),
    INDEX (RecordID),
    INDEX (Rating)
);

-- Wishlist table
CREATE TABLE IF NOT EXISTS wishlist (
    WishlistID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    RecordID INT NOT NULL,
    AddedDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (UserID) REFERENCES users(UserID),
    FOREIGN KEY (RecordID) REFERENCES vinylrecords(RecordID),
    UNIQUE KEY (UserID, RecordID),
    INDEX (UserID),
    INDEX (RecordID)
);

-- Collection Management table
CREATE TABLE IF NOT EXISTS collections (
    CollectionID INT AUTO_INCREMENT PRIMARY KEY,
    UserID INT NOT NULL,
    RecordID INT NOT NULL,
    PurchaseDate DATE,
    PurchasePrice DECIMAL(10,2),
    Notes TEXT,
    Condition VARCHAR(50),
    GradingNotes TEXT,
    ForSale BOOLEAN DEFAULT FALSE,
    AskingPrice DECIMAL(10,2),
    FOREIGN KEY (UserID) REFERENCES users(UserID),
    FOREIGN KEY (RecordID) REFERENCES vinylrecords(RecordID),
    UNIQUE KEY (UserID, RecordID),
    INDEX (UserID),
    INDEX (ForSale)
);

-- Inventory History table
CREATE TABLE IF NOT EXISTS inventory_history (
    HistoryID INT AUTO_INCREMENT PRIMARY KEY,
    RecordID INT NOT NULL,
    ChangeDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    ChangeType ENUM('Restock', 'Sale', 'Adjustment', 'Return') NOT NULL,
    Quantity INT NOT NULL,
    PreviousStock INT NOT NULL,
    NewStock INT NOT NULL,
    Notes TEXT,
    FOREIGN KEY (RecordID) REFERENCES vinylrecords(RecordID),
    INDEX (RecordID),
    INDEX (ChangeDate)
);

-- Record Grading Details table
CREATE TABLE IF NOT EXISTS grading_details (
    GradingID INT AUTO_INCREMENT PRIMARY KEY,
    RecordID INT NOT NULL,
    MediaGrade VARCHAR(10),
    SleeveGrade VARCHAR(10),
    GradingNotes TEXT,
    GradedBy VARCHAR(100),
    GradingDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (RecordID) REFERENCES vinylrecords(RecordID),
    INDEX (RecordID)
);

-- Add sample data for testing
INSERT INTO vinylrecords (Title, Artist, Genre, ReleaseYear, `Condition`, Price, Stock, Format, Label)
VALUES 
('Dark Side of the Moon', 'Pink Floyd', 'Rock', 1973, 'New', 29.99, 5, 'LP', 'Harvest'),
('Abbey Road', 'The Beatles', 'Rock', 1969, 'Used - Like New', 32.99, 4, 'LP', 'Apple'),
('Led Zeppelin IV', 'Led Zeppelin', 'Rock', 1971, 'Used - Good', 26.99, 6, 'LP', 'Atlantic'),
('Back in Black', 'AC/DC', 'Rock', 1980, 'Used - Very Good', 23.99, 3, 'LP', 'Albert'),
('Kind of Blue', 'Miles Davis', 'Jazz', 1959, 'Used - Very Good', 24.99, 3, 'LP', 'Columbia'),
('Blue Train', 'John Coltrane', 'Jazz', 1957, 'Used - Good', 21.99, 2, '45 RPM', 'Blue Note'),
('Time Out', 'The Dave Brubeck Quartet', 'Jazz', 1959, 'New', 22.99, 5, 'LP', 'Columbia'),
('Mingus Ah Um', 'Charles Mingus', 'Jazz', 1959, 'Used - Like New', 25.99, 2, 'LP', 'Columbia'),
('Thriller', 'Michael Jackson', 'Pop', 1982, 'New', 27.99, 8, 'LP', 'Epic'),
('1989', 'Taylor Swift', 'Pop', 2014, 'New', 25.99, 7, 'EP', 'Big Machine'),
('Purple Rain', 'Prince', 'Pop', 1984, 'Used - Very Good', 22.99, 3, 'EP', 'Warner Bros'),
('Future Nostalgia', 'Dua Lipa', 'Pop', 2020, 'New', 24.99, 6, 'LP', 'Warner'),
('The Four Seasons', 'Vivaldi', 'Classical', 1980, 'New', 19.99, 6, 'LP', 'Deutsche Grammophon'),
('Rhapsody in Blue', 'George Gershwin', 'Classical', 1955, 'Used - Fair', 14.99, 1, '78 RPM', 'Columbia'),
('Symphony No. 5', 'Beethoven', 'Classical', 1960, 'Used - Good', 17.99, 2, 'LP', 'Decca'),
('Swan Lake', 'Tchaikovsky', 'Classical', 1976, 'Used - Like New', 21.99, 3, 'LP', 'Melodiya');