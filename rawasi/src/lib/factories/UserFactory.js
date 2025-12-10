// src/lib/factories/UserFactory.js

/**
 * User Factory Interface
 * Defines the contract for creating users
 */
class UserFactoryInterface {
  createUser(userData) {
    throw new Error("Method 'createUser()' must be implemented");
  }
}

/**
 * Base User Class
 */
class User {
  constructor(id, firstName, lastName, email, password, phoneNumber) {
    this.userID = id;
    this.firstName = firstName;
    this.lastName = lastName;
    this.email = email;
    this.password = password;
    this.phoneNumber = phoneNumber;
  }

  register() {
    console.log(`Registering user: ${this.email}`);
    return true;
  }

  login(password) {
    console.log(`Logging in user: ${this.email}`);
    return this.password === password;
  }
}

/**
 * Provider Class - extends User
 */
class Provider extends User {
  constructor(userData) {
    super(
      userData.id,
      userData.firstName || userData.name?.split(' ')[0] || '',
      userData.lastName || userData.name?.split(' ')[1] || '',
      userData.email,
      userData.password,
      userData.phoneNumber || userData.phone
    );

    this.providerID = userData.id;
    this.companySize = userData.companySize || null;
    this.description = userData.description || '';
    this.completedProjects = userData.completedProjects || [];
    this.website = userData.website || '';
    this.location = userData.location || '';
    this.experienceYears = userData.experienceYears || 0;
    this.techType = userData.techType || [];
    this.rating = userData.rating || 0;
    this.role = 'provider';
  }

  addProfile(completedProjects, technologies, experienceYears, companySize, description) {
    this.completedProjects = completedProjects;
    this.techType = technologies;
    this.experienceYears = experienceYears;
    this.companySize = companySize;
    this.description = description;
  }

  updateProfile(completedProjects, technologies, experienceYears, companySize, description, website, location) {
    this.addProfile(completedProjects, technologies, experienceYears, companySize, description);
    this.website = website;
    this.location = location;
  }

  viewRequestDetails() {
    console.log('Viewing request details for provider:', this.providerID);
  }

  rejectRequest() {
    console.log('Rejecting request');
  }

  acceptRequest() {
    console.log('Accepting request');
  }

  startCommunication(communication) {
    console.log('Starting communication:', communication);
  }

  submitProposal() {
    console.log('Submitting proposal');
  }

  viewReport() {
    console.log('Viewing report');
  }

  calculateAverageRating() {
    return this.rating;
  }
}

/**
 * Project Owner Class - extends User
 */
class ProjectOwner extends User {
  constructor(userData) {
    super(
      userData.id,
      userData.firstName || userData.name?.split(' ')[0] || '',
      userData.lastName || userData.name?.split(' ')[1] || '',
      userData.email,
      userData.password,
      userData.phoneNumber || userData.phone
    );

    this.projectOwnerID = userData.id;
    this.projects = userData.projects || [];
    this.description = userData.description || '';
    this.budget = userData.budget || null;
    this.startDate = userData.startDate || null;
    this.endDate = userData.endDate || null;
    this.sizeOfBuilding = userData.sizeOfBuilding || null;
    this.location = userData.location || '';
    this.role = 'owner';
  }

  addProjectType(projectID, description, typeOfBuilding, sizeOfBuilding, budget, startDate, location) {
    const newProject = {
      projectID,
      description,
      typeOfBuilding,
      sizeOfBuilding,
      budget,
      startDate,
      location
    };
    this.projects.push(newProject);
  }

  requestRecommendedProvider() {
    console.log('Requesting recommended providers');
  }

  viewDashboard() {
    console.log('Viewing dashboard for owner:', this.projectOwnerID);
  }

  viewReport() {
    console.log('Viewing report');
  }

  rateProvider(providerID, rating) {
    console.log(`Rating provider ${providerID}: ${rating}`);
  }
}

/**
 * Concrete User Factory
 * Implements the Factory Pattern to create appropriate user types
 */
class UserFactory extends UserFactoryInterface {
  /**
   * Creates a user based on the role specified in userData
   * @param {Object} userData - User registration data
   * @param {string} userData.role - Either 'provider' or 'owner'
   * @returns {Provider|ProjectOwner} - The created user instance
   */
  createUser(userData) {
    if (!userData || !userData.role) {
      throw new Error('User data must include a role (provider or owner)');
    }

    // Ensure userData has an ID
    if (!userData.id) {
      userData.id = this.generateID();
    }

    // Create user based on role
    switch (userData.role.toLowerCase()) {
      case 'provider':
        return new Provider(userData);

      case 'owner':
        return new ProjectOwner(userData);

      default:
        throw new Error(`Unknown user role: ${userData.role}`);
    }
  }

  /**
   * Generates a unique ID for users
   * @returns {string} - Unique identifier
   */
  generateID() {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Singleton instance of the factory
const userFactory = new UserFactory();

export {
  UserFactory,
  UserFactoryInterface,
  User,
  Provider,
  ProjectOwner,
  userFactory
};