import { gql } from "@apollo/client";

export const GET_AQHI = gql`
  query GetAQHI(
    $year: Int,
    $locations: [String!],
    $datasetType: String,
    $limit: Int,
    $offset: Int
  ) {
    aqhiData(
      year: $year,
      locations: $locations,
      datasetType: $datasetType,
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
    $datasetType: String
  ) {
    kpis(
      year: $year,
      locations: $locations,
      datasetType: $datasetType
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
    $datasetType: String
  ) {
    hourlyAvg(
      year: $year,
      locations: $locations,
      datasetType: $datasetType
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
    $datasetType: String
  ) {
    categoryDistribution(
      year: $year,
      locations: $locations,
      datasetType: $datasetType
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
    $datasetType: String
  ) {
    mapPoints(
      year: $year,
      locations: $locations,
      datasetType: $datasetType
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