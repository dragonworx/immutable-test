# #2 Decision Making & Communication

The following details describe the system design for the given brief. We will make the following assumptions:

- _"submit any road network"_ and _"all proposals for a given system from A -> B"_ are the same thing, meaning a list of tunnels _(start_location, end_location, max_cars_per_hour)_.
- The algorithm from question 1 would be the core functionality used to accept the uploaded road networks, so its assumed the same format is used providing the max_capacity_per_hour.
- Users may need to have an account with this service, and require authentication though this was not specified in the requirements so it will be omitted here.

## The Architecture

### **Stack:**

- **NodeJS** - Express server, single microservice for all endpoints
- **TypeScript** - Build with TypeScript for type safety and team scale
- **DynamoDB** - NoSQL database. Since format of stored network is identical to what would need to be returned, we can index by id and store same shape as response to `POST` endpoint. Reads are cheaper, and we don't need to worry about strong consistency.
- **Docker** - Containerise application, have images build and tagged with release versions and deployed with Amazon Elastic Container Registry

### **API Design:**

We will use REST for our API. A single endpoint for submitting road networks, and a single one for accessing them.

#### **Submitting a road network**

To submit a road network, users would use a `POST` endpoint.

- **POST** `/road-network/submit`

The endpoint would accept `application/json` for the body, which would be an array of triplets describing the tunnels `[[<start>, <end>, <max_per_hour>], [...], ...]`. This compact format would save space as large inputs are expected.

The endpoint would use standard HTTP statuses to indicate success or failure, for example:

- `201` - The network was parsed processed/stored successfully
- `400` - If the request was malformed or could not be parsed successfully
- `500` - If an error occurred during saving the data

The successful response would be of type `application/json` and would contain a guid for the new network, and the maximum calculated throughput. For example:

```
{
  "id": "c222c089-82b6-4204-96b0-7964fa787fc3",
  "max_capacity": 716
}
```

#### **Accessing a road network**

Users would need to call a `GET` endpoint passing the `id` returned from the original `POST` endpoint.

- **GET** `/road-network/{id}`

The endpoint would return `404` if the id was not found, or a successful response containing the original tunnel data in the triplet form _(start, end, max)_, along with the max calculated capacity.

```
{
  "tunnels": [[<start>, <end>, <max_capacity>]],
  "max_capacity": 716,
}
```

## The Resources

We would require the following resources:

- Cloud Provisioned Compute (eg. AWS EC2) - It would be fair to assume that the traffic for this service would be low, and used infrequently by industry professional users. Therefore a smaller EC2 size would be suitable. These servers would run Ubuntu.
- Cloud Provisioned PostgreSQL storage - Should only require a few tables: `TunnelNetwork {id, max_capacity}`, `SubTunnel {network_id, start, end, max_capacity}`.
- Load Balancer configured for production - A load balancer would allow for horizontal scaling when the system is under load, if ever.
- Staging, Production environments

## The Deployment, Monitoring and Testing Principles of the Team

- Code would be stored on Gitgub/Bitbucket, and deployment could be handled a code deployment service such as Pipelines, Bamboo, AWS CodeDeploy, Octopus, Jenkins, TeamCity etc
- Staging environment would exist which would allow for testing before changes are released manually to production
- CI hooks such as successful merges to `master` would deploy changes to staging, with manual deployments to production required to promote changes after stablisation/validation in staging
- Deployment would build and push new Docker image to resitry and it would be updated on prod/staging by Amazon Elastic Container Registry
- "Tunnel capacity calculation" algorithm would be in a separate package to microservice, so it could be extensively unit tested. It would be a dependency of the microservice which would keep microservice lean and just concerned with routing and endpoints
- Integration testing for the microservice could run locally and also be used for semantic monitoring on staging
- Semantic monitoring would run against integration tests and simluate E2E transactions, validating their schema and output. This monitoring would trigger alerts upon failure and be available via a dashboard, and email/Slack integration.
- Amazon Cloudwatch would be used to monitor resources and page on-call team members if defined thresholds are breached, as well as sending emails and Slack notifications to teams
