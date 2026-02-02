import { gql } from '@apollo/client';

export const IMPORT_MEMBERS = gql`
  mutation ImportMembers($csvData: String!, $fileType: String!) {
    importMembers(csvData: $csvData, fileType: $fileType) {
      success
      message
      importedCount
      skippedCount
      errorCount
      errors
      duplicates
    }
  }
`;

export const GET_MEMBER_IMPORT_TEMPLATE = gql`
  mutation GetMemberImportTemplate {
    getMemberImportTemplate
  }
`;
