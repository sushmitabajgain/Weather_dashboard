import { gql } from "@apollo/client";

export const GET_AQHI = gql`
  query GetAQHI(
    $year: Int,
    $locations: [String!],
    $datasetType: String,
    $lastHours: Int,
    $limit: Int,
    $offset: Int
  ) {
    aqhiData(
      year: $year,
      locations: $locations,
      datasetType: $datasetType,
      lastHours: $lastHours,
      limit: $limit,
      offset: $offset
    ) {
      locationName
      aqhi
      category
      datetime
      latitude
      longitude
      datasetType
    }
  }
`;

export const GET_KPIS = gql`
  query GetKPIS(
    $year: Int,
    $locations: [String!],
    $datasetType: String,
    $lastHours: Int
  ) {
    kpis(
      year: $year,
      locations: $locations,
      datasetType: $datasetType,
      lastHours: $lastHours
    ) {
      total
      avg
      max
      locations
    }
  }
`;

export const GET_HOURLY = gql`
  query GetHourly(
    $year: Int,
    $locations: [String!],
    $datasetType: String,
    $lastHours: Int
  ) {
    hourlyAvg(
      year: $year,
      locations: $locations,
      datasetType: $datasetType,
      lastHours: $lastHours
    ) {
      hour
      avg
    }
  }
`;

export const GET_CATEGORY = gql`
  query GetCategory(
    $year: Int,
    $locations: [String!],
    $datasetType: String,
    $lastHours: Int
  ) {
    categoryDistribution(
      year: $year,
      locations: $locations,
      datasetType: $datasetType,
      lastHours: $lastHours
    ) {
      category
      count
    }
  }
`;

export const GET_MAP = gql`
  query GetMap(
    $year: Int,
    $locations: [String!],
    $datasetType: String,
    $lastHours: Int
  ) {
    mapPoints(
      year: $year,
      locations: $locations,
      datasetType: $datasetType,
      lastHours: $lastHours
    ) {
      locationName
      latitude
      longitude
      aqhi
      category
    }
  }
`;

export const GET_LOCATIONS = gql`
  query {
    locations
  }
`;