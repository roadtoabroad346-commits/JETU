export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      academic_units: {
        Row: {
          campus_id: number | null;
          id: number;
          institution_id: number;
          parent_unit_id: number | null;
          slug: string;
          title: string;
          unit_type: string;
        };
        Insert: {
          campus_id?: number | null;
          id: number;
          institution_id: number;
          parent_unit_id?: number | null;
          slug: string;
          title: string;
          unit_type?: string;
        };
        Update: {
          campus_id?: number | null;
          id?: number;
          institution_id?: number;
          parent_unit_id?: number | null;
          slug?: string;
          title?: string;
          unit_type?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'academic_units_campus_id_institution_id_fkey';
            columns: ['campus_id', 'institution_id'];
            isOneToOne: false;
            referencedRelation: 'campuses';
            referencedColumns: ['id', 'institution_id'];
          },
          {
            foreignKeyName: 'academic_units_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'academic_units_institution_id_fkey';
            columns: ['institution_id'];
            isOneToOne: false;
            referencedRelation: 'institutions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'academic_units_institution_id_fkey';
            columns: ['institution_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['institution_id'];
          },
          {
            foreignKeyName: 'academic_units_parent_unit_id_institution_id_fkey';
            columns: ['parent_unit_id', 'institution_id'];
            isOneToOne: false;
            referencedRelation: 'academic_units';
            referencedColumns: ['id', 'institution_id'];
          },
        ];
      };
      admission_intakes: {
        Row: {
          academic_year_start: number;
          ends_on: string | null;
          id: number;
          planned_capacity: number | null;
          program_id: number;
          starts_on: string | null;
          term_code: string;
        };
        Insert: {
          academic_year_start: number;
          ends_on?: string | null;
          id: number;
          planned_capacity?: number | null;
          program_id: number;
          starts_on?: string | null;
          term_code: string;
        };
        Update: {
          academic_year_start?: number;
          ends_on?: string | null;
          id?: number;
          planned_capacity?: number | null;
          program_id?: number;
          starts_on?: string | null;
          term_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'admission_intakes_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'admission_intakes_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'degree_programs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'admission_intakes_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['program_id'];
          },
          {
            foreignKeyName: 'admission_intakes_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['program_id'];
          },
        ];
      };
      application_round_deadlines: {
        Row: {
          application_round_id: number;
          deadline_id: number;
        };
        Insert: {
          application_round_id: number;
          deadline_id: number;
        };
        Update: {
          application_round_id?: number;
          deadline_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'application_round_deadlines_application_round_id_fkey';
            columns: ['application_round_id'];
            isOneToOne: false;
            referencedRelation: 'application_rounds';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'application_round_deadlines_deadline_id_fkey';
            columns: ['deadline_id'];
            isOneToOne: false;
            referencedRelation: 'deadlines';
            referencedColumns: ['id'];
          },
        ];
      };
      application_rounds: {
        Row: {
          closes_at: string | null;
          decision_by: string | null;
          id: number;
          intake_id: number;
          is_rolling: boolean;
          opens_at: string | null;
          round_code: string;
          title: string;
        };
        Insert: {
          closes_at?: string | null;
          decision_by?: string | null;
          id: number;
          intake_id: number;
          is_rolling?: boolean;
          opens_at?: string | null;
          round_code: string;
          title: string;
        };
        Update: {
          closes_at?: string | null;
          decision_by?: string | null;
          id?: number;
          intake_id?: number;
          is_rolling?: boolean;
          opens_at?: string | null;
          round_code?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'application_rounds_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'application_rounds_intake_id_fkey';
            columns: ['intake_id'];
            isOneToOne: false;
            referencedRelation: 'admission_intakes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'application_rounds_intake_id_fkey';
            columns: ['intake_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['intake_id'];
          },
        ];
      };
      campuses: {
        Row: {
          address_line: string | null;
          campus_code: string;
          city_id: number | null;
          country_id: number;
          id: number;
          institution_id: number;
          name: string;
        };
        Insert: {
          address_line?: string | null;
          campus_code: string;
          city_id?: number | null;
          country_id: number;
          id: number;
          institution_id: number;
          name: string;
        };
        Update: {
          address_line?: string | null;
          campus_code?: string;
          city_id?: number | null;
          country_id?: number;
          id?: number;
          institution_id?: number;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'campuses_city_id_country_id_fkey';
            columns: ['city_id', 'country_id'];
            isOneToOne: false;
            referencedRelation: 'cities';
            referencedColumns: ['id', 'country_id'];
          },
          {
            foreignKeyName: 'campuses_country_id_fkey';
            columns: ['country_id'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'campuses_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'campuses_institution_id_fkey';
            columns: ['institution_id'];
            isOneToOne: false;
            referencedRelation: 'institutions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'campuses_institution_id_fkey';
            columns: ['institution_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['institution_id'];
          },
        ];
      };
      catalog_entities: {
        Row: {
          archived_at: string | null;
          created_at: string;
          effective_from: string | null;
          effective_until: string | null;
          entity_type: string;
          id: number;
          last_checked_at: string | null;
          publication_status_code: string;
          revision: number;
          updated_at: string;
          verification_state_code: string;
        };
        Insert: {
          archived_at?: string | null;
          created_at?: string;
          effective_from?: string | null;
          effective_until?: string | null;
          entity_type: string;
          id?: never;
          last_checked_at?: string | null;
          publication_status_code?: string;
          revision?: number;
          updated_at?: string;
          verification_state_code?: string;
        };
        Update: {
          archived_at?: string | null;
          created_at?: string;
          effective_from?: string | null;
          effective_until?: string | null;
          entity_type?: string;
          id?: never;
          last_checked_at?: string | null;
          publication_status_code?: string;
          revision?: number;
          updated_at?: string;
          verification_state_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'catalog_entities_publication_status_code_fkey';
            columns: ['publication_status_code'];
            isOneToOne: false;
            referencedRelation: 'publication_status';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'catalog_entities_verification_state_code_fkey';
            columns: ['verification_state_code'];
            isOneToOne: false;
            referencedRelation: 'verification_states';
            referencedColumns: ['code'];
          },
        ];
      };
      catalog_entity_tags: {
        Row: {
          catalog_entity_id: number;
          tag_code: string;
        };
        Insert: {
          catalog_entity_id: number;
          tag_code: string;
        };
        Update: {
          catalog_entity_id?: number;
          tag_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'catalog_entity_tags_catalog_entity_id_fkey';
            columns: ['catalog_entity_id'];
            isOneToOne: false;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'catalog_entity_tags_tag_code_fkey';
            columns: ['tag_code'];
            isOneToOne: false;
            referencedRelation: 'opportunity_tags';
            referencedColumns: ['code'];
          },
        ];
      };
      cities: {
        Row: {
          country_id: number;
          id: number;
          is_active: boolean;
          latitude: number | null;
          longitude: number | null;
          name: string;
          region_id: number | null;
          slug: string;
        };
        Insert: {
          country_id: number;
          id?: never;
          is_active?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          name: string;
          region_id?: number | null;
          slug: string;
        };
        Update: {
          country_id?: number;
          id?: never;
          is_active?: boolean;
          latitude?: number | null;
          longitude?: number | null;
          name?: string;
          region_id?: number | null;
          slug?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'cities_country_id_fkey';
            columns: ['country_id'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cities_region_id_country_id_fkey';
            columns: ['region_id', 'country_id'];
            isOneToOne: false;
            referencedRelation: 'regions';
            referencedColumns: ['id', 'country_id'];
          },
        ];
      };
      citizenship_eligibility: {
        Row: {
          country_id: number;
          eligibility_kind: string;
          eligibility_requirement_id: number;
        };
        Insert: {
          country_id: number;
          eligibility_kind: string;
          eligibility_requirement_id: number;
        };
        Update: {
          country_id?: number;
          eligibility_kind?: string;
          eligibility_requirement_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'citizenship_eligibility_country_id_fkey';
            columns: ['country_id'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'citizenship_eligibility_eligibility_requirement_id_fkey';
            columns: ['eligibility_requirement_id'];
            isOneToOne: false;
            referencedRelation: 'eligibility_requirements';
            referencedColumns: ['id'];
          },
        ];
      };
      cost_of_living: {
        Row: {
          amount_max: number | null;
          amount_min: number;
          billing_period: string;
          campus_id: number | null;
          city_id: number | null;
          currency_code: string;
          id: number;
          includes_housing: boolean;
        };
        Insert: {
          amount_max?: number | null;
          amount_min: number;
          billing_period: string;
          campus_id?: number | null;
          city_id?: number | null;
          currency_code: string;
          id: number;
          includes_housing?: boolean;
        };
        Update: {
          amount_max?: number | null;
          amount_min?: number;
          billing_period?: string;
          campus_id?: number | null;
          city_id?: number | null;
          currency_code?: string;
          id?: number;
          includes_housing?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'cost_of_living_campus_id_fkey';
            columns: ['campus_id'];
            isOneToOne: false;
            referencedRelation: 'campuses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cost_of_living_campus_id_fkey';
            columns: ['campus_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['campus_id'];
          },
          {
            foreignKeyName: 'cost_of_living_city_id_fkey';
            columns: ['city_id'];
            isOneToOne: false;
            referencedRelation: 'cities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'cost_of_living_currency_code_fkey';
            columns: ['currency_code'];
            isOneToOne: false;
            referencedRelation: 'fee_currency';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'cost_of_living_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
        ];
      };
      countries: {
        Row: {
          default_currency_code: string | null;
          id: number;
          is_active: boolean;
          iso2: string;
          iso3: string;
          name: string;
        };
        Insert: {
          default_currency_code?: string | null;
          id?: never;
          is_active?: boolean;
          iso2: string;
          iso3: string;
          name: string;
        };
        Update: {
          default_currency_code?: string | null;
          id?: never;
          is_active?: boolean;
          iso2?: string;
          iso3?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'countries_default_currency_code_fkey';
            columns: ['default_currency_code'];
            isOneToOne: false;
            referencedRelation: 'fee_currency';
            referencedColumns: ['code'];
          },
        ];
      };
      coverage_items: {
        Row: {
          code: string;
          is_active: boolean;
          label: string;
        };
        Insert: {
          code: string;
          is_active?: boolean;
          label: string;
        };
        Update: {
          code?: string;
          is_active?: boolean;
          label?: string;
        };
        Relationships: [];
      };
      data_revisions: {
        Row: {
          catalog_entity_id: number;
          change_reason: string;
          changed_by: string | null;
          created_at: string;
          id: number;
          revision: number;
          snapshot: Json;
          source_claim_id: number | null;
        };
        Insert: {
          catalog_entity_id: number;
          change_reason: string;
          changed_by?: string | null;
          created_at?: string;
          id?: never;
          revision: number;
          snapshot: Json;
          source_claim_id?: number | null;
        };
        Update: {
          catalog_entity_id?: number;
          change_reason?: string;
          changed_by?: string | null;
          created_at?: string;
          id?: never;
          revision?: number;
          snapshot?: Json;
          source_claim_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'data_revisions_catalog_entity_id_fkey';
            columns: ['catalog_entity_id'];
            isOneToOne: false;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'data_revisions_source_claim_id_catalog_entity_id_fkey';
            columns: ['source_claim_id', 'catalog_entity_id'];
            isOneToOne: false;
            referencedRelation: 'source_claims';
            referencedColumns: ['id', 'catalog_entity_id'];
          },
        ];
      };
      deadlines: {
        Row: {
          deadline_type: string;
          due_at: string | null;
          id: number;
          is_rolling: boolean;
          timezone_name: string | null;
          title: string;
        };
        Insert: {
          deadline_type: string;
          due_at?: string | null;
          id: number;
          is_rolling?: boolean;
          timezone_name?: string | null;
          title: string;
        };
        Update: {
          deadline_type?: string;
          due_at?: string | null;
          id?: number;
          is_rolling?: boolean;
          timezone_name?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'deadlines_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
        ];
      };
      degree_levels: {
        Row: {
          code: string;
          is_active: boolean;
          label: string;
          rank: number;
        };
        Insert: {
          code: string;
          is_active?: boolean;
          label: string;
          rank: number;
        };
        Update: {
          code?: string;
          is_active?: boolean;
          label?: string;
          rank?: number;
        };
        Relationships: [];
      };
      degree_program_delivery_modes: {
        Row: {
          delivery_mode_code: string;
          program_id: number;
        };
        Insert: {
          delivery_mode_code: string;
          program_id: number;
        };
        Update: {
          delivery_mode_code?: string;
          program_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'degree_program_delivery_modes_delivery_mode_code_fkey';
            columns: ['delivery_mode_code'];
            isOneToOne: false;
            referencedRelation: 'program_delivery_modes';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'degree_program_delivery_modes_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'degree_programs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'degree_program_delivery_modes_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['program_id'];
          },
          {
            foreignKeyName: 'degree_program_delivery_modes_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['program_id'];
          },
        ];
      };
      degree_program_languages: {
        Row: {
          language_code: string;
          minimum_share_percent: number | null;
          program_id: number;
        };
        Insert: {
          language_code: string;
          minimum_share_percent?: number | null;
          program_id: number;
        };
        Update: {
          language_code?: string;
          minimum_share_percent?: number | null;
          program_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'degree_program_languages_language_code_fkey';
            columns: ['language_code'];
            isOneToOne: false;
            referencedRelation: 'languages_of_instruction';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'degree_program_languages_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'degree_programs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'degree_program_languages_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['program_id'];
          },
          {
            foreignKeyName: 'degree_program_languages_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['program_id'];
          },
        ];
      };
      degree_programs: {
        Row: {
          academic_unit_id: number;
          credit_system: string | null;
          credit_value: number | null;
          degree_level_code: string;
          duration_months: number | null;
          id: number;
          primary_field_id: number;
          slug: string;
          title: string;
        };
        Insert: {
          academic_unit_id: number;
          credit_system?: string | null;
          credit_value?: number | null;
          degree_level_code: string;
          duration_months?: number | null;
          id: number;
          primary_field_id: number;
          slug: string;
          title: string;
        };
        Update: {
          academic_unit_id?: number;
          credit_system?: string | null;
          credit_value?: number | null;
          degree_level_code?: string;
          duration_months?: number | null;
          id?: number;
          primary_field_id?: number;
          slug?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'degree_programs_academic_unit_id_fkey';
            columns: ['academic_unit_id'];
            isOneToOne: false;
            referencedRelation: 'academic_units';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'degree_programs_academic_unit_id_fkey';
            columns: ['academic_unit_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['academic_unit_id'];
          },
          {
            foreignKeyName: 'degree_programs_degree_level_code_fkey';
            columns: ['degree_level_code'];
            isOneToOne: false;
            referencedRelation: 'degree_levels';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'degree_programs_degree_level_code_fkey';
            columns: ['degree_level_code'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['degree_level_code'];
          },
          {
            foreignKeyName: 'degree_programs_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'degree_programs_primary_field_id_fkey';
            columns: ['primary_field_id'];
            isOneToOne: false;
            referencedRelation: 'fields_of_study';
            referencedColumns: ['id'];
          },
        ];
      };
      eligibility_requirements: {
        Row: {
          description: string;
          id: number;
          is_mandatory: boolean;
          requirement_type: string;
          title: string;
        };
        Insert: {
          description: string;
          id: number;
          is_mandatory?: boolean;
          requirement_type: string;
          title: string;
        };
        Update: {
          description?: string;
          id?: number;
          is_mandatory?: boolean;
          requirement_type?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'eligibility_requirements_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
        ];
      };
      estimated_tuition: {
        Row: {
          academic_year_start: number | null;
          amount_max: number | null;
          amount_min: number;
          billing_period: string;
          campus_id: number | null;
          currency_code: string;
          id: number;
          includes_mandatory_fees: boolean;
          intake_id: number | null;
          program_id: number;
        };
        Insert: {
          academic_year_start?: number | null;
          amount_max?: number | null;
          amount_min: number;
          billing_period: string;
          campus_id?: number | null;
          currency_code: string;
          id: number;
          includes_mandatory_fees?: boolean;
          intake_id?: number | null;
          program_id: number;
        };
        Update: {
          academic_year_start?: number | null;
          amount_max?: number | null;
          amount_min?: number;
          billing_period?: string;
          campus_id?: number | null;
          currency_code?: string;
          id?: number;
          includes_mandatory_fees?: boolean;
          intake_id?: number | null;
          program_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'estimated_tuition_currency_code_fkey';
            columns: ['currency_code'];
            isOneToOne: false;
            referencedRelation: 'fee_currency';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'estimated_tuition_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'estimated_tuition_intake_id_program_id_fkey';
            columns: ['intake_id', 'program_id'];
            isOneToOne: false;
            referencedRelation: 'admission_intakes';
            referencedColumns: ['id', 'program_id'];
          },
          {
            foreignKeyName: 'estimated_tuition_program_id_campus_id_fkey';
            columns: ['program_id', 'campus_id'];
            isOneToOne: false;
            referencedRelation: 'program_campuses';
            referencedColumns: ['program_id', 'campus_id'];
          },
          {
            foreignKeyName: 'estimated_tuition_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'degree_programs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'estimated_tuition_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['program_id'];
          },
          {
            foreignKeyName: 'estimated_tuition_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['program_id'];
          },
        ];
      };
      fee_breakdown_items: {
        Row: {
          amount_max: number | null;
          amount_min: number;
          billing_period: string;
          estimated_tuition_id: number;
          fee_category: string;
          id: number;
          is_mandatory: boolean;
          is_refundable: boolean;
          label: string;
        };
        Insert: {
          amount_max?: number | null;
          amount_min: number;
          billing_period: string;
          estimated_tuition_id: number;
          fee_category: string;
          id?: never;
          is_mandatory?: boolean;
          is_refundable?: boolean;
          label: string;
        };
        Update: {
          amount_max?: number | null;
          amount_min?: number;
          billing_period?: string;
          estimated_tuition_id?: number;
          fee_category?: string;
          id?: never;
          is_mandatory?: boolean;
          is_refundable?: boolean;
          label?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'fee_breakdown_items_estimated_tuition_id_fkey';
            columns: ['estimated_tuition_id'];
            isOneToOne: false;
            referencedRelation: 'estimated_tuition';
            referencedColumns: ['id'];
          },
        ];
      };
      fee_currency: {
        Row: {
          code: string;
          is_active: boolean;
          minor_unit: number;
          name: string;
        };
        Insert: {
          code: string;
          is_active?: boolean;
          minor_unit?: number;
          name: string;
        };
        Update: {
          code?: string;
          is_active?: boolean;
          minor_unit?: number;
          name?: string;
        };
        Relationships: [];
      };
      fields_of_study: {
        Row: {
          code: string;
          id: number;
          is_active: boolean;
          name: string;
          parent_id: number | null;
        };
        Insert: {
          code: string;
          id?: never;
          is_active?: boolean;
          name: string;
          parent_id?: number | null;
        };
        Update: {
          code?: string;
          id?: never;
          is_active?: boolean;
          name?: string;
          parent_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fields_of_study_parent_id_fkey';
            columns: ['parent_id'];
            isOneToOne: false;
            referencedRelation: 'fields_of_study';
            referencedColumns: ['id'];
          },
        ];
      };
      financial_aid_schemes: {
        Row: {
          aid_type: string;
          id: number;
          institution_id: number;
          scheme_code: string;
          title: string;
        };
        Insert: {
          aid_type: string;
          id: number;
          institution_id: number;
          scheme_code: string;
          title: string;
        };
        Update: {
          aid_type?: string;
          id?: number;
          institution_id?: number;
          scheme_code?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'financial_aid_schemes_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_aid_schemes_institution_id_fkey';
            columns: ['institution_id'];
            isOneToOne: false;
            referencedRelation: 'institutions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'financial_aid_schemes_institution_id_fkey';
            columns: ['institution_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['institution_id'];
          },
        ];
      };
      funding_limits: {
        Row: {
          amount_max: number | null;
          amount_min: number | null;
          currency_code: string | null;
          id: number;
          limit_period: string;
          renewal_conditions: string | null;
          scholarship_benefit_id: number;
        };
        Insert: {
          amount_max?: number | null;
          amount_min?: number | null;
          currency_code?: string | null;
          id?: never;
          limit_period: string;
          renewal_conditions?: string | null;
          scholarship_benefit_id: number;
        };
        Update: {
          amount_max?: number | null;
          amount_min?: number | null;
          currency_code?: string | null;
          id?: never;
          limit_period?: string;
          renewal_conditions?: string | null;
          scholarship_benefit_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'funding_limits_currency_code_fkey';
            columns: ['currency_code'];
            isOneToOne: false;
            referencedRelation: 'fee_currency';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'funding_limits_scholarship_benefit_id_fkey';
            columns: ['scholarship_benefit_id'];
            isOneToOne: false;
            referencedRelation: 'scholarship_benefits';
            referencedColumns: ['id'];
          },
        ];
      };
      institution_accreditations: {
        Row: {
          accreditation_code: string | null;
          accreditation_status: string;
          accreditor_name: string;
          expires_on: string | null;
          granted_on: string | null;
          id: number;
          institution_id: number;
        };
        Insert: {
          accreditation_code?: string | null;
          accreditation_status: string;
          accreditor_name: string;
          expires_on?: string | null;
          granted_on?: string | null;
          id: number;
          institution_id: number;
        };
        Update: {
          accreditation_code?: string | null;
          accreditation_status?: string;
          accreditor_name?: string;
          expires_on?: string | null;
          granted_on?: string | null;
          id?: number;
          institution_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'institution_accreditations_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'institution_accreditations_institution_id_fkey';
            columns: ['institution_id'];
            isOneToOne: false;
            referencedRelation: 'institutions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'institution_accreditations_institution_id_fkey';
            columns: ['institution_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['institution_id'];
          },
        ];
      };
      institution_names_translations: {
        Row: {
          id: number;
          institution_id: number;
          locale: string;
          name_kind: string;
          source_claim_id: number;
          translated_name: string;
        };
        Insert: {
          id?: never;
          institution_id: number;
          locale: string;
          name_kind?: string;
          source_claim_id: number;
          translated_name: string;
        };
        Update: {
          id?: never;
          institution_id?: number;
          locale?: string;
          name_kind?: string;
          source_claim_id?: number;
          translated_name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'institution_names_translation_source_claim_id_institution__fkey';
            columns: ['source_claim_id', 'institution_id'];
            isOneToOne: false;
            referencedRelation: 'source_claims';
            referencedColumns: ['id', 'catalog_entity_id'];
          },
          {
            foreignKeyName: 'institution_names_translations_institution_id_fkey';
            columns: ['institution_id'];
            isOneToOne: false;
            referencedRelation: 'institutions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'institution_names_translations_institution_id_fkey';
            columns: ['institution_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['institution_id'];
          },
        ];
      };
      institutions: {
        Row: {
          city_id: number | null;
          country_id: number;
          founded_year: number | null;
          id: number;
          institution_type: string;
          legal_name: string;
          slug: string;
          website_url: string | null;
        };
        Insert: {
          city_id?: number | null;
          country_id: number;
          founded_year?: number | null;
          id: number;
          institution_type: string;
          legal_name: string;
          slug: string;
          website_url?: string | null;
        };
        Update: {
          city_id?: number | null;
          country_id?: number;
          founded_year?: number | null;
          id?: number;
          institution_type?: string;
          legal_name?: string;
          slug?: string;
          website_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'institutions_city_id_country_id_fkey';
            columns: ['city_id', 'country_id'];
            isOneToOne: false;
            referencedRelation: 'cities';
            referencedColumns: ['id', 'country_id'];
          },
          {
            foreignKeyName: 'institutions_country_id_fkey';
            columns: ['country_id'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'institutions_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
        ];
      };
      intake_eligibility_requirements: {
        Row: {
          eligibility_requirement_id: number;
          intake_id: number;
        };
        Insert: {
          eligibility_requirement_id: number;
          intake_id: number;
        };
        Update: {
          eligibility_requirement_id?: number;
          intake_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'intake_eligibility_requirements_eligibility_requirement_id_fkey';
            columns: ['eligibility_requirement_id'];
            isOneToOne: false;
            referencedRelation: 'eligibility_requirements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'intake_eligibility_requirements_intake_id_fkey';
            columns: ['intake_id'];
            isOneToOne: false;
            referencedRelation: 'admission_intakes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'intake_eligibility_requirements_intake_id_fkey';
            columns: ['intake_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['intake_id'];
          },
        ];
      };
      languages_of_instruction: {
        Row: {
          code: string;
          is_active: boolean;
          name: string;
        };
        Insert: {
          code: string;
          is_active?: boolean;
          name: string;
        };
        Update: {
          code?: string;
          is_active?: boolean;
          name?: string;
        };
        Relationships: [];
      };
      nomination_routes: {
        Row: {
          description: string;
          id: number;
          is_required: boolean;
          nominator_type: string;
          scholarship_cycle_id: number;
          title: string;
        };
        Insert: {
          description: string;
          id: number;
          is_required?: boolean;
          nominator_type: string;
          scholarship_cycle_id: number;
          title: string;
        };
        Update: {
          description?: string;
          id?: number;
          is_required?: boolean;
          nominator_type?: string;
          scholarship_cycle_id?: number;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'nomination_routes_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'nomination_routes_scholarship_cycle_id_fkey';
            columns: ['scholarship_cycle_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['scholarship_cycle_id'];
          },
          {
            foreignKeyName: 'nomination_routes_scholarship_cycle_id_fkey';
            columns: ['scholarship_cycle_id'];
            isOneToOne: false;
            referencedRelation: 'scholarship_cycles';
            referencedColumns: ['id'];
          },
        ];
      };
      official_sources: {
        Row: {
          canonical_url: string;
          created_at: string;
          effective_from: string | null;
          effective_until: string | null;
          first_seen_at: string;
          id: number;
          is_active: boolean;
          last_checked_at: string;
          locale: string;
          publisher_name: string;
          source_title: string;
          source_type: string;
          updated_at: string;
        };
        Insert: {
          canonical_url: string;
          created_at?: string;
          effective_from?: string | null;
          effective_until?: string | null;
          first_seen_at?: string;
          id?: never;
          is_active?: boolean;
          last_checked_at: string;
          locale: string;
          publisher_name: string;
          source_title: string;
          source_type?: string;
          updated_at?: string;
        };
        Update: {
          canonical_url?: string;
          created_at?: string;
          effective_from?: string | null;
          effective_until?: string | null;
          first_seen_at?: string;
          id?: never;
          is_active?: boolean;
          last_checked_at?: string;
          locale?: string;
          publisher_name?: string;
          source_title?: string;
          source_type?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      opportunities: {
        Row: {
          ends_on: string | null;
          id: number;
          official_url: string;
          opportunity_type: string;
          provider_institution_id: number | null;
          slug: string;
          starts_on: string | null;
          title: string;
        };
        Insert: {
          ends_on?: string | null;
          id: number;
          official_url: string;
          opportunity_type: string;
          provider_institution_id?: number | null;
          slug: string;
          starts_on?: string | null;
          title: string;
        };
        Update: {
          ends_on?: string | null;
          id?: number;
          official_url?: string;
          opportunity_type?: string;
          provider_institution_id?: number | null;
          slug?: string;
          starts_on?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'opportunities_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'opportunities_provider_institution_id_fkey';
            columns: ['provider_institution_id'];
            isOneToOne: false;
            referencedRelation: 'institutions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'opportunities_provider_institution_id_fkey';
            columns: ['provider_institution_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['institution_id'];
          },
        ];
      };
      opportunity_deadlines: {
        Row: {
          deadline_id: number;
          opportunity_id: number;
        };
        Insert: {
          deadline_id: number;
          opportunity_id: number;
        };
        Update: {
          deadline_id?: number;
          opportunity_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'opportunity_deadlines_deadline_id_fkey';
            columns: ['deadline_id'];
            isOneToOne: false;
            referencedRelation: 'deadlines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'opportunity_deadlines_opportunity_id_fkey';
            columns: ['opportunity_id'];
            isOneToOne: false;
            referencedRelation: 'opportunities';
            referencedColumns: ['id'];
          },
        ];
      };
      opportunity_tags: {
        Row: {
          code: string;
          is_active: boolean;
          label: string;
        };
        Insert: {
          code: string;
          is_active?: boolean;
          label: string;
        };
        Update: {
          code?: string;
          is_active?: boolean;
          label?: string;
        };
        Relationships: [];
      };
      prerequisites: {
        Row: {
          description: string;
          eligibility_requirement_id: number;
          id: number;
          minimum_value: number | null;
          prerequisite_type: string;
          subject: string | null;
          value_unit: string | null;
        };
        Insert: {
          description: string;
          eligibility_requirement_id: number;
          id?: never;
          minimum_value?: number | null;
          prerequisite_type: string;
          subject?: string | null;
          value_unit?: string | null;
        };
        Update: {
          description?: string;
          eligibility_requirement_id?: number;
          id?: never;
          minimum_value?: number | null;
          prerequisite_type?: string;
          subject?: string | null;
          value_unit?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'prerequisites_eligibility_requirement_id_fkey';
            columns: ['eligibility_requirement_id'];
            isOneToOne: false;
            referencedRelation: 'eligibility_requirements';
            referencedColumns: ['id'];
          },
        ];
      };
      program_campuses: {
        Row: {
          campus_id: number;
          is_primary: boolean;
          program_id: number;
        };
        Insert: {
          campus_id: number;
          is_primary?: boolean;
          program_id: number;
        };
        Update: {
          campus_id?: number;
          is_primary?: boolean;
          program_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'program_campuses_campus_id_fkey';
            columns: ['campus_id'];
            isOneToOne: false;
            referencedRelation: 'campuses';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'program_campuses_campus_id_fkey';
            columns: ['campus_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['campus_id'];
          },
          {
            foreignKeyName: 'program_campuses_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'degree_programs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'program_campuses_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['program_id'];
          },
          {
            foreignKeyName: 'program_campuses_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['program_id'];
          },
        ];
      };
      program_delivery_modes: {
        Row: {
          code: string;
          is_active: boolean;
          label: string;
        };
        Insert: {
          code: string;
          is_active?: boolean;
          label: string;
        };
        Update: {
          code?: string;
          is_active?: boolean;
          label?: string;
        };
        Relationships: [];
      };
      program_eligibility_requirements: {
        Row: {
          eligibility_requirement_id: number;
          program_id: number;
        };
        Insert: {
          eligibility_requirement_id: number;
          program_id: number;
        };
        Update: {
          eligibility_requirement_id?: number;
          program_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'program_eligibility_requirement_eligibility_requirement_id_fkey';
            columns: ['eligibility_requirement_id'];
            isOneToOne: false;
            referencedRelation: 'eligibility_requirements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'program_eligibility_requirements_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'degree_programs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'program_eligibility_requirements_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['program_id'];
          },
          {
            foreignKeyName: 'program_eligibility_requirements_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['program_id'];
          },
        ];
      };
      publication_status: {
        Row: {
          code: string;
          is_public: boolean;
          label: string;
        };
        Insert: {
          code: string;
          is_public?: boolean;
          label: string;
        };
        Update: {
          code?: string;
          is_public?: boolean;
          label?: string;
        };
        Relationships: [];
      };
      regions: {
        Row: {
          code: string;
          country_id: number;
          id: number;
          is_active: boolean;
          name: string;
        };
        Insert: {
          code: string;
          country_id: number;
          id?: never;
          is_active?: boolean;
          name: string;
        };
        Update: {
          code?: string;
          country_id?: number;
          id?: never;
          is_active?: boolean;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'regions_country_id_fkey';
            columns: ['country_id'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['id'];
          },
        ];
      };
      required_tests: {
        Row: {
          eligibility_requirement_id: number;
          id: number;
          purpose: string;
          test_code: string;
          waivers_allowed: boolean;
        };
        Insert: {
          eligibility_requirement_id: number;
          id?: never;
          purpose?: string;
          test_code: string;
          waivers_allowed?: boolean;
        };
        Update: {
          eligibility_requirement_id?: number;
          id?: never;
          purpose?: string;
          test_code?: string;
          waivers_allowed?: boolean;
        };
        Relationships: [
          {
            foreignKeyName: 'required_tests_eligibility_requirement_id_fkey';
            columns: ['eligibility_requirement_id'];
            isOneToOne: false;
            referencedRelation: 'eligibility_requirements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'required_tests_test_code_fkey';
            columns: ['test_code'];
            isOneToOne: false;
            referencedRelation: 'standardized_tests';
            referencedColumns: ['code'];
          },
        ];
      };
      scholarship_benefits: {
        Row: {
          coverage_item_code: string;
          coverage_percent: number | null;
          description: string;
          id: number;
          is_in_kind: boolean;
          scholarship_cycle_id: number;
        };
        Insert: {
          coverage_item_code: string;
          coverage_percent?: number | null;
          description: string;
          id: number;
          is_in_kind?: boolean;
          scholarship_cycle_id: number;
        };
        Update: {
          coverage_item_code?: string;
          coverage_percent?: number | null;
          description?: string;
          id?: number;
          is_in_kind?: boolean;
          scholarship_cycle_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'scholarship_benefits_coverage_item_code_fkey';
            columns: ['coverage_item_code'];
            isOneToOne: false;
            referencedRelation: 'coverage_items';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'scholarship_benefits_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scholarship_benefits_scholarship_cycle_id_fkey';
            columns: ['scholarship_cycle_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['scholarship_cycle_id'];
          },
          {
            foreignKeyName: 'scholarship_benefits_scholarship_cycle_id_fkey';
            columns: ['scholarship_cycle_id'];
            isOneToOne: false;
            referencedRelation: 'scholarship_cycles';
            referencedColumns: ['id'];
          },
        ];
      };
      scholarship_cycle_deadlines: {
        Row: {
          deadline_id: number;
          scholarship_cycle_id: number;
        };
        Insert: {
          deadline_id: number;
          scholarship_cycle_id: number;
        };
        Update: {
          deadline_id?: number;
          scholarship_cycle_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'scholarship_cycle_deadlines_deadline_id_fkey';
            columns: ['deadline_id'];
            isOneToOne: false;
            referencedRelation: 'deadlines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scholarship_cycle_deadlines_scholarship_cycle_id_fkey';
            columns: ['scholarship_cycle_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['scholarship_cycle_id'];
          },
          {
            foreignKeyName: 'scholarship_cycle_deadlines_scholarship_cycle_id_fkey';
            columns: ['scholarship_cycle_id'];
            isOneToOne: false;
            referencedRelation: 'scholarship_cycles';
            referencedColumns: ['id'];
          },
        ];
      };
      scholarship_cycles: {
        Row: {
          academic_year_start: number;
          award_end_on: string | null;
          award_start_on: string | null;
          closes_at: string | null;
          cycle_code: string;
          id: number;
          opens_at: string | null;
          scholarship_id: number;
        };
        Insert: {
          academic_year_start: number;
          award_end_on?: string | null;
          award_start_on?: string | null;
          closes_at?: string | null;
          cycle_code: string;
          id: number;
          opens_at?: string | null;
          scholarship_id: number;
        };
        Update: {
          academic_year_start?: number;
          award_end_on?: string | null;
          award_start_on?: string | null;
          closes_at?: string | null;
          cycle_code?: string;
          id?: number;
          opens_at?: string | null;
          scholarship_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'scholarship_cycles_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scholarship_cycles_scholarship_id_fkey';
            columns: ['scholarship_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['scholarship_id'];
          },
          {
            foreignKeyName: 'scholarship_cycles_scholarship_id_fkey';
            columns: ['scholarship_id'];
            isOneToOne: false;
            referencedRelation: 'scholarships';
            referencedColumns: ['id'];
          },
        ];
      };
      scholarship_eligibility_requirements: {
        Row: {
          eligibility_requirement_id: number;
          scholarship_cycle_id: number;
        };
        Insert: {
          eligibility_requirement_id: number;
          scholarship_cycle_id: number;
        };
        Update: {
          eligibility_requirement_id?: number;
          scholarship_cycle_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'scholarship_eligibility_require_eligibility_requirement_id_fkey';
            columns: ['eligibility_requirement_id'];
            isOneToOne: false;
            referencedRelation: 'eligibility_requirements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scholarship_eligibility_requirements_scholarship_cycle_id_fkey';
            columns: ['scholarship_cycle_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['scholarship_cycle_id'];
          },
          {
            foreignKeyName: 'scholarship_eligibility_requirements_scholarship_cycle_id_fkey';
            columns: ['scholarship_cycle_id'];
            isOneToOne: false;
            referencedRelation: 'scholarship_cycles';
            referencedColumns: ['id'];
          },
        ];
      };
      scholarship_program_links: {
        Row: {
          program_id: number;
          relationship_type: string;
          scholarship_cycle_id: number;
        };
        Insert: {
          program_id: number;
          relationship_type?: string;
          scholarship_cycle_id: number;
        };
        Update: {
          program_id?: number;
          relationship_type?: string;
          scholarship_cycle_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'scholarship_program_links_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'degree_programs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scholarship_program_links_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['program_id'];
          },
          {
            foreignKeyName: 'scholarship_program_links_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['program_id'];
          },
          {
            foreignKeyName: 'scholarship_program_links_scholarship_cycle_id_fkey';
            columns: ['scholarship_cycle_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['scholarship_cycle_id'];
          },
          {
            foreignKeyName: 'scholarship_program_links_scholarship_cycle_id_fkey';
            columns: ['scholarship_cycle_id'];
            isOneToOne: false;
            referencedRelation: 'scholarship_cycles';
            referencedColumns: ['id'];
          },
        ];
      };
      scholarships: {
        Row: {
          award_type: string;
          financial_aid_scheme_id: number | null;
          id: number;
          official_url: string;
          provider_institution_id: number | null;
          slug: string;
          title: string;
        };
        Insert: {
          award_type: string;
          financial_aid_scheme_id?: number | null;
          id: number;
          official_url: string;
          provider_institution_id?: number | null;
          slug: string;
          title: string;
        };
        Update: {
          award_type?: string;
          financial_aid_scheme_id?: number | null;
          id?: number;
          official_url?: string;
          provider_institution_id?: number | null;
          slug?: string;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scholarships_financial_aid_scheme_id_fkey';
            columns: ['financial_aid_scheme_id'];
            isOneToOne: false;
            referencedRelation: 'financial_aid_schemes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scholarships_id_fkey';
            columns: ['id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scholarships_provider_institution_id_fkey';
            columns: ['provider_institution_id'];
            isOneToOne: false;
            referencedRelation: 'institutions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scholarships_provider_institution_id_fkey';
            columns: ['provider_institution_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['institution_id'];
          },
        ];
      };
      source_claims: {
        Row: {
          catalog_entity_id: number;
          claim_key: string;
          claim_text: string;
          content_hash: string;
          created_at: string;
          effective_from: string | null;
          effective_until: string | null;
          id: number;
          observed_at: string;
          source_id: number;
          verification_state_code: string;
        };
        Insert: {
          catalog_entity_id: number;
          claim_key: string;
          claim_text: string;
          content_hash: string;
          created_at?: string;
          effective_from?: string | null;
          effective_until?: string | null;
          id?: never;
          observed_at?: string;
          source_id: number;
          verification_state_code?: string;
        };
        Update: {
          catalog_entity_id?: number;
          claim_key?: string;
          claim_text?: string;
          content_hash?: string;
          created_at?: string;
          effective_from?: string | null;
          effective_until?: string | null;
          id?: never;
          observed_at?: string;
          source_id?: number;
          verification_state_code?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'source_claims_catalog_entity_id_fkey';
            columns: ['catalog_entity_id'];
            isOneToOne: false;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'source_claims_source_id_fkey';
            columns: ['source_id'];
            isOneToOne: false;
            referencedRelation: 'official_sources';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'source_claims_verification_state_code_fkey';
            columns: ['verification_state_code'];
            isOneToOne: false;
            referencedRelation: 'verification_states';
            referencedColumns: ['code'];
          },
        ];
      };
      standardized_tests: {
        Row: {
          code: string;
          is_active: boolean;
          maximum_score: number | null;
          minimum_score: number | null;
          name: string;
          score_unit: string;
        };
        Insert: {
          code: string;
          is_active?: boolean;
          maximum_score?: number | null;
          minimum_score?: number | null;
          name: string;
          score_unit: string;
        };
        Update: {
          code?: string;
          is_active?: boolean;
          maximum_score?: number | null;
          minimum_score?: number | null;
          name?: string;
          score_unit?: string;
        };
        Relationships: [];
      };
      student_account_deletions: {
        Row: {
          started_at: string;
          user_id: string;
        };
        Insert: {
          started_at?: string;
          user_id: string;
        };
        Update: {
          started_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      student_profile_attachments: {
        Row: {
          byte_size: number;
          category: string;
          created_at: string;
          file_name: string;
          id: string;
          mime_type: string;
          object_path: string;
          user_id: string;
        };
        Insert: {
          byte_size: number;
          category: string;
          created_at?: string;
          file_name: string;
          id?: string;
          mime_type: string;
          object_path: string;
          user_id: string;
        };
        Update: {
          byte_size?: number;
          category?: string;
          created_at?: string;
          file_name?: string;
          id?: string;
          mime_type?: string;
          object_path?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      student_profile_versions: {
        Row: {
          document: Json;
          saved_at: string;
          user_id: string;
          version: number;
        };
        Insert: {
          document: Json;
          saved_at?: string;
          user_id: string;
          version: number;
        };
        Update: {
          document?: Json;
          saved_at?: string;
          user_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'student_profile_versions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'student_profiles';
            referencedColumns: ['user_id'];
          },
        ];
      };
      student_profiles: {
        Row: {
          document: Json;
          updated_at: string;
          user_id: string;
          version: number;
        };
        Insert: {
          document?: Json;
          updated_at?: string;
          user_id: string;
          version?: number;
        };
        Update: {
          document?: Json;
          updated_at?: string;
          user_id?: string;
          version?: number;
        };
        Relationships: [];
      };
      test_score_thresholds: {
        Row: {
          component: string;
          id: number;
          maximum_score: number | null;
          minimum_score: number | null;
          required_test_id: number;
          score_unit: string;
        };
        Insert: {
          component?: string;
          id?: never;
          maximum_score?: number | null;
          minimum_score?: number | null;
          required_test_id: number;
          score_unit: string;
        };
        Update: {
          component?: string;
          id?: never;
          maximum_score?: number | null;
          minimum_score?: number | null;
          required_test_id?: number;
          score_unit?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'test_score_thresholds_required_test_id_fkey';
            columns: ['required_test_id'];
            isOneToOne: false;
            referencedRelation: 'required_tests';
            referencedColumns: ['id'];
          },
        ];
      };
      translation_entries: {
        Row: {
          catalog_entity_id: number;
          created_at: string;
          field_name: string;
          id: number;
          locale: string;
          source_claim_id: number;
          translated_text: string;
          updated_at: string;
        };
        Insert: {
          catalog_entity_id: number;
          created_at?: string;
          field_name: string;
          id?: never;
          locale: string;
          source_claim_id: number;
          translated_text: string;
          updated_at?: string;
        };
        Update: {
          catalog_entity_id?: number;
          created_at?: string;
          field_name?: string;
          id?: never;
          locale?: string;
          source_claim_id?: number;
          translated_text?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'translation_entries_catalog_entity_id_fkey';
            columns: ['catalog_entity_id'];
            isOneToOne: false;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'translation_entries_source_claim_id_catalog_entity_id_fkey';
            columns: ['source_claim_id', 'catalog_entity_id'];
            isOneToOne: false;
            referencedRelation: 'source_claims';
            referencedColumns: ['id', 'catalog_entity_id'];
          },
        ];
      };
      verification_runs: {
        Row: {
          completed_at: string | null;
          created_at: string;
          id: number;
          notes: string | null;
          outcome: string;
          reviewer_id: string | null;
          source_id: number;
          started_at: string;
        };
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          id?: never;
          notes?: string | null;
          outcome: string;
          reviewer_id?: string | null;
          source_id: number;
          started_at?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          id?: never;
          notes?: string | null;
          outcome?: string;
          reviewer_id?: string | null;
          source_id?: number;
          started_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'verification_runs_source_id_fkey';
            columns: ['source_id'];
            isOneToOne: false;
            referencedRelation: 'official_sources';
            referencedColumns: ['id'];
          },
        ];
      };
      verification_states: {
        Row: {
          code: string;
          is_verified: boolean;
          label: string;
        };
        Insert: {
          code: string;
          is_verified?: boolean;
          label: string;
        };
        Update: {
          code?: string;
          is_verified?: boolean;
          label?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      published_degree_programs: {
        Row: {
          academic_unit_id: number | null;
          academic_unit_source_url: string | null;
          academic_unit_title: string | null;
          academic_year_start: number | null;
          campus_id: number | null;
          campus_name: string | null;
          campus_source_url: string | null;
          country_code: string | null;
          degree_level: string | null;
          degree_level_code: string | null;
          evidence_checked_at: string | null;
          field_code: string | null;
          field_name: string | null;
          institution_id: number | null;
          institution_name: string | null;
          institution_slug: string | null;
          institution_source_url: string | null;
          intake_id: number | null;
          intake_source_url: string | null;
          program_id: number | null;
          program_slug: string | null;
          program_source_url: string | null;
          program_title: string | null;
          starts_on: string | null;
          term_code: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'academic_units_id_fkey';
            columns: ['academic_unit_id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'admission_intakes_id_fkey';
            columns: ['intake_id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'campuses_id_fkey';
            columns: ['campus_id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'degree_programs_id_fkey';
            columns: ['program_id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'institutions_id_fkey';
            columns: ['institution_id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
        ];
      };
      published_scholarship_opportunities: {
        Row: {
          academic_year_start: number | null;
          closes_at: string | null;
          cycle_code: string | null;
          cycle_source_url: string | null;
          evidence_checked_at: string | null;
          opens_at: string | null;
          program_id: number | null;
          program_slug: string | null;
          program_source_url: string | null;
          program_title: string | null;
          relationship_type: string | null;
          scholarship_cycle_id: number | null;
          scholarship_id: number | null;
          scholarship_slug: string | null;
          scholarship_source_url: string | null;
          scholarship_title: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'degree_programs_id_fkey';
            columns: ['program_id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scholarship_cycles_id_fkey';
            columns: ['scholarship_cycle_id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scholarships_id_fkey';
            columns: ['scholarship_id'];
            isOneToOne: true;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Functions: {
      assert_catalog_entity_evidence: {
        Args: { target_entity_id: number };
        Returns: undefined;
      };
      catalog_search: {
        Args: { p_filters?: Json };
        Returns: {
          city: string;
          country: string;
          id: string;
          level: string;
          major: string;
          next_deadline: string;
          program_name: string;
          study_mode: string;
          teaching_language: string;
          total_count: number;
          tuition_amount: number;
          tuition_as_of: string;
          tuition_currency: string;
          tuition_period: string;
          university_name: string;
          university_slug: string;
        }[];
      };
      import_catalog_bundle: { Args: { p_bundle: Json }; Returns: Json };
      publish_catalog_entity: {
        Args: { p_catalog_entity_id: number; p_checked_at: string };
        Returns: number;
      };
      review_source_claim: {
        Args: { p_claim_id: number; p_verification_run_id: number };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    keyof DefaultSchema['Tables'] | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    keyof DefaultSchema['Enums'] | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {},
  },
} as const;
