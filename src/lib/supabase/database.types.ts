export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
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
        ComputedFields: never;
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
        ComputedFields: never;
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
      application_checklist_items: {
        Row: {
          application_id: string;
          checklist_key: string | null;
          completed_at: string | null;
          created_at: string;
          id: string;
          is_mandatory: boolean;
          origin: string;
          roadmap_task_id: string | null;
          sort_order: number;
          source_claim_id: number | null;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
          verification_state: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          application_id: string;
          checklist_key?: string | null;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          is_mandatory?: boolean;
          origin: string;
          roadmap_task_id?: string | null;
          sort_order?: number;
          source_claim_id?: number | null;
          status?: string;
          title: string;
          updated_at?: string;
          user_id: string;
          verification_state?: string;
          version?: number;
        };
        Update: {
          application_id?: string;
          checklist_key?: string | null;
          completed_at?: string | null;
          created_at?: string;
          id?: string;
          is_mandatory?: boolean;
          origin?: string;
          roadmap_task_id?: string | null;
          sort_order?: number;
          source_claim_id?: number | null;
          status?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
          verification_state?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'application_checklist_items_application_id_user_id_fkey';
            columns: ['application_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'application_checklist_items_roadmap_task_id_user_id_fkey';
            columns: ['roadmap_task_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'roadmap_tasks';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'application_checklist_items_source_claim_id_fkey';
            columns: ['source_claim_id'];
            isOneToOne: false;
            referencedRelation: 'source_claims';
            referencedColumns: ['id'];
          },
        ];
      };
      application_events: {
        Row: {
          actor_id: string;
          application_id: string;
          details: NonNullable<Json>;
          event_type: string;
          evidence: string | null;
          from_status: string | null;
          id: number;
          idempotency_key: string | null;
          occurred_at: string;
          reason: string | null;
          source_type: string;
          to_status: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          actor_id: string;
          application_id: string;
          details?: NonNullable<Json>;
          event_type: string;
          evidence?: string | null;
          from_status?: string | null;
          id?: never;
          idempotency_key?: string | null;
          occurred_at?: string;
          reason?: string | null;
          source_type: string;
          to_status?: string | null;
          user_id: string;
        };
        Update: {
          actor_id?: string;
          application_id?: string;
          details?: NonNullable<Json>;
          event_type?: string;
          evidence?: string | null;
          from_status?: string | null;
          id?: never;
          idempotency_key?: string | null;
          occurred_at?: string;
          reason?: string | null;
          source_type?: string;
          to_status?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'application_events_application_id_user_id_fkey';
            columns: ['application_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      application_round_deadlines: {
        Row: {
          application_round_id: number;
          deadline_id: number;
        };
        ComputedFields: never;
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
        ComputedFields: never;
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
      applications: {
        Row: {
          application_fee_amount: number | null;
          application_fee_currency: string | null;
          archived_at: string | null;
          country_code_snapshot: string | null;
          created_at: string;
          cycle_year: number;
          degree_level_snapshot: string;
          fee_waiver_state: string;
          id: string;
          institution_name_snapshot: string;
          intake_id: number | null;
          notes: string;
          official_deadline_at: string | null;
          official_deadline_date: string | null;
          official_deadline_precision: string;
          official_deadline_timezone: string | null;
          official_portal_url: string | null;
          priority: string;
          program_id: number;
          program_source_checked_at: string | null;
          program_source_url: string | null;
          program_title_snapshot: string;
          roadmap_submission_task_id: string | null;
          status: string;
          submission_evidence: string | null;
          submission_provenance: string | null;
          submitted_at: string | null;
          updated_at: string;
          user_id: string;
          user_reference_id: string | null;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          application_fee_amount?: number | null;
          application_fee_currency?: string | null;
          archived_at?: string | null;
          country_code_snapshot?: string | null;
          created_at?: string;
          cycle_year: number;
          degree_level_snapshot: string;
          fee_waiver_state?: string;
          id?: string;
          institution_name_snapshot: string;
          intake_id?: number | null;
          notes?: string;
          official_deadline_at?: string | null;
          official_deadline_date?: string | null;
          official_deadline_precision?: string;
          official_deadline_timezone?: string | null;
          official_portal_url?: string | null;
          priority?: string;
          program_id: number;
          program_source_checked_at?: string | null;
          program_source_url?: string | null;
          program_title_snapshot: string;
          roadmap_submission_task_id?: string | null;
          status?: string;
          submission_evidence?: string | null;
          submission_provenance?: string | null;
          submitted_at?: string | null;
          updated_at?: string;
          user_id: string;
          user_reference_id?: string | null;
          version?: number;
        };
        Update: {
          application_fee_amount?: number | null;
          application_fee_currency?: string | null;
          archived_at?: string | null;
          country_code_snapshot?: string | null;
          created_at?: string;
          cycle_year?: number;
          degree_level_snapshot?: string;
          fee_waiver_state?: string;
          id?: string;
          institution_name_snapshot?: string;
          intake_id?: number | null;
          notes?: string;
          official_deadline_at?: string | null;
          official_deadline_date?: string | null;
          official_deadline_precision?: string;
          official_deadline_timezone?: string | null;
          official_portal_url?: string | null;
          priority?: string;
          program_id?: number;
          program_source_checked_at?: string | null;
          program_source_url?: string | null;
          program_title_snapshot?: string;
          roadmap_submission_task_id?: string | null;
          status?: string;
          submission_evidence?: string | null;
          submission_provenance?: string | null;
          submitted_at?: string | null;
          updated_at?: string;
          user_id?: string;
          user_reference_id?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'applications_application_fee_currency_fkey';
            columns: ['application_fee_currency'];
            isOneToOne: false;
            referencedRelation: 'fee_currency';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'applications_intake_id_fkey';
            columns: ['intake_id'];
            isOneToOne: false;
            referencedRelation: 'admission_intakes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'applications_intake_id_fkey';
            columns: ['intake_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['intake_id'];
          },
          {
            foreignKeyName: 'applications_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'degree_programs';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'applications_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['program_id'];
          },
          {
            foreignKeyName: 'applications_program_id_fkey';
            columns: ['program_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['program_id'];
          },
          {
            foreignKeyName: 'applications_roadmap_submission_task_id_user_id_fkey';
            columns: ['roadmap_submission_task_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'roadmap_tasks';
            referencedColumns: ['id', 'user_id'];
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
        ComputedFields: never;
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
      catalog_editor_events: {
        Row: {
          action: string;
          actor_id: string | null;
          after_snapshot: NonNullable<Json>;
          before_snapshot: NonNullable<Json>;
          claim_id: number | null;
          created_at: string;
          entity_id: number;
          id: number;
          note: string;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          after_snapshot: NonNullable<Json>;
          before_snapshot: NonNullable<Json>;
          claim_id?: number | null;
          created_at?: string;
          entity_id: number;
          id?: never;
          note: string;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          after_snapshot?: NonNullable<Json>;
          before_snapshot?: NonNullable<Json>;
          claim_id?: number | null;
          created_at?: string;
          entity_id?: number;
          id?: never;
          note?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'catalog_editor_events_claim_id_fkey';
            columns: ['claim_id'];
            isOneToOne: false;
            referencedRelation: 'source_claims';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'catalog_editor_events_entity_id_fkey';
            columns: ['entity_id'];
            isOneToOne: false;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
        ];
      };
      catalog_editor_memberships: {
        Row: {
          granted_at: string;
          role: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          granted_at?: string;
          role: string;
          user_id: string;
        };
        Update: {
          granted_at?: string;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
          snapshot: NonNullable<Json>;
          source_claim_id: number | null;
        };
        ComputedFields: never;
        Insert: {
          catalog_entity_id: number;
          change_reason: string;
          changed_by?: string | null;
          created_at?: string;
          id?: never;
          revision: number;
          snapshot: NonNullable<Json>;
          source_claim_id?: number | null;
        };
        Update: {
          catalog_entity_id?: number;
          change_reason?: string;
          changed_by?: string | null;
          created_at?: string;
          id?: never;
          revision?: number;
          snapshot?: NonNullable<Json>;
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
          date_precision: string;
          deadline_type: string;
          due_at: string | null;
          due_date: string | null;
          id: number;
          is_rolling: boolean;
          timezone_name: string | null;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          date_precision?: string;
          deadline_type: string;
          due_at?: string | null;
          due_date?: string | null;
          id: number;
          is_rolling?: boolean;
          timezone_name?: string | null;
          title: string;
        };
        Update: {
          date_precision?: string;
          deadline_type?: string;
          due_at?: string | null;
          due_date?: string | null;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
      institution_school_profiles: {
        Row: {
          institution_id: number;
          partnership_state: string;
          school_kind: string;
          source_claim_id: number;
        };
        ComputedFields: never;
        Insert: {
          institution_id: number;
          partnership_state?: string;
          school_kind: string;
          source_claim_id: number;
        };
        Update: {
          institution_id?: number;
          partnership_state?: string;
          school_kind?: string;
          source_claim_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'institution_school_profiles_institution_id_fkey';
            columns: ['institution_id'];
            isOneToOne: true;
            referencedRelation: 'institutions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'institution_school_profiles_institution_id_fkey';
            columns: ['institution_id'];
            isOneToOne: true;
            referencedRelation: 'published_degree_programs';
            referencedColumns: ['institution_id'];
          },
          {
            foreignKeyName: 'institution_school_profiles_source_claim_id_institution_id_fkey';
            columns: ['source_claim_id', 'institution_id'];
            isOneToOne: false;
            referencedRelation: 'source_claims';
            referencedColumns: ['id', 'catalog_entity_id'];
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
      matching_configuration: {
        Row: {
          is_active: boolean;
          version: string;
          weights: NonNullable<Json>;
        };
        ComputedFields: never;
        Insert: {
          is_active?: boolean;
          version: string;
          weights: NonNullable<Json>;
        };
        Update: {
          is_active?: boolean;
          version?: string;
          weights?: NonNullable<Json>;
        };
        Relationships: [];
      };
      matching_preferences: {
        Row: {
          preferences: NonNullable<Json>;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          preferences?: NonNullable<Json>;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          preferences?: NonNullable<Json>;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      matching_results: {
        Row: {
          created_at: string;
          eligibility: NonNullable<Json>;
          entity_id: number;
          entity_type: string;
          preference_score: number | null;
          rank_order: number;
          run_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          eligibility: NonNullable<Json>;
          entity_id: number;
          entity_type: string;
          preference_score?: number | null;
          rank_order: number;
          run_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          eligibility?: NonNullable<Json>;
          entity_id?: number;
          entity_type?: string;
          preference_score?: number | null;
          rank_order?: number;
          run_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'matching_results_entity_id_fkey';
            columns: ['entity_id'];
            isOneToOne: false;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'matching_results_run_id_user_id_fkey';
            columns: ['run_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'matching_runs';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      matching_runs: {
        Row: {
          candidate_count: number;
          created_at: string;
          id: string;
          preferences_snapshot: NonNullable<Json>;
          profile_version: number;
          rate_slot: number;
          rules_version: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          candidate_count: number;
          created_at?: string;
          id?: string;
          preferences_snapshot: NonNullable<Json>;
          profile_version: number;
          rate_slot: number;
          rules_version: string;
          user_id: string;
        };
        Update: {
          candidate_count?: number;
          created_at?: string;
          id?: string;
          preferences_snapshot?: NonNullable<Json>;
          profile_version?: number;
          rate_slot?: number;
          rules_version?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'matching_runs_rules_version_fkey';
            columns: ['rules_version'];
            isOneToOne: false;
            referencedRelation: 'matching_configuration';
            referencedColumns: ['version'];
          },
        ];
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
        ComputedFields: never;
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
        ComputedFields: never;
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
          cost_amount_max: number | null;
          cost_amount_min: number | null;
          cost_currency_code: string | null;
          cost_state: string;
          country_id: number | null;
          eligibility_age_max: number | null;
          eligibility_age_min: number | null;
          eligibility_grade_max: number | null;
          eligibility_grade_min: number | null;
          eligibility_summary: string | null;
          ends_on: string | null;
          id: number;
          location_text: string | null;
          official_application_url: string | null;
          official_url: string;
          opportunity_type: string;
          participation_format: string;
          provider_institution_id: number | null;
          provider_name: string | null;
          risk_summary: string | null;
          slug: string;
          source_claim_id: number | null;
          sponsor_name: string | null;
          starts_on: string | null;
          summary: string | null;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          cost_amount_max?: number | null;
          cost_amount_min?: number | null;
          cost_currency_code?: string | null;
          cost_state?: string;
          country_id?: number | null;
          eligibility_age_max?: number | null;
          eligibility_age_min?: number | null;
          eligibility_grade_max?: number | null;
          eligibility_grade_min?: number | null;
          eligibility_summary?: string | null;
          ends_on?: string | null;
          id: number;
          location_text?: string | null;
          official_application_url?: string | null;
          official_url: string;
          opportunity_type: string;
          participation_format?: string;
          provider_institution_id?: number | null;
          provider_name?: string | null;
          risk_summary?: string | null;
          slug: string;
          source_claim_id?: number | null;
          sponsor_name?: string | null;
          starts_on?: string | null;
          summary?: string | null;
          title: string;
        };
        Update: {
          cost_amount_max?: number | null;
          cost_amount_min?: number | null;
          cost_currency_code?: string | null;
          cost_state?: string;
          country_id?: number | null;
          eligibility_age_max?: number | null;
          eligibility_age_min?: number | null;
          eligibility_grade_max?: number | null;
          eligibility_grade_min?: number | null;
          eligibility_summary?: string | null;
          ends_on?: string | null;
          id?: number;
          location_text?: string | null;
          official_application_url?: string | null;
          official_url?: string;
          opportunity_type?: string;
          participation_format?: string;
          provider_institution_id?: number | null;
          provider_name?: string | null;
          risk_summary?: string | null;
          slug?: string;
          source_claim_id?: number | null;
          sponsor_name?: string | null;
          starts_on?: string | null;
          summary?: string | null;
          title?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'opportunities_cost_currency_code_fkey';
            columns: ['cost_currency_code'];
            isOneToOne: false;
            referencedRelation: 'fee_currency';
            referencedColumns: ['code'];
          },
          {
            foreignKeyName: 'opportunities_country_id_fkey';
            columns: ['country_id'];
            isOneToOne: false;
            referencedRelation: 'countries';
            referencedColumns: ['id'];
          },
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
          {
            foreignKeyName: 'opportunities_source_claim_parent';
            columns: ['source_claim_id', 'id'];
            isOneToOne: false;
            referencedRelation: 'source_claims';
            referencedColumns: ['id', 'catalog_entity_id'];
          },
        ];
      };
      opportunity_deadlines: {
        Row: {
          deadline_id: number;
          opportunity_id: number;
        };
        ComputedFields: never;
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
      opportunity_eligibility_rules: {
        Row: {
          description: string;
          id: number;
          opportunity_id: number;
          requirement_state: string;
          rule_kind: string;
          source_claim_id: number;
        };
        ComputedFields: never;
        Insert: {
          description: string;
          id?: never;
          opportunity_id: number;
          requirement_state?: string;
          rule_kind: string;
          source_claim_id: number;
        };
        Update: {
          description?: string;
          id?: never;
          opportunity_id?: number;
          requirement_state?: string;
          rule_kind?: string;
          source_claim_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'opportunity_eligibility_rules_opportunity_id_fkey';
            columns: ['opportunity_id'];
            isOneToOne: false;
            referencedRelation: 'opportunities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'opportunity_eligibility_rules_source_claim_id_opportunity__fkey';
            columns: ['source_claim_id', 'opportunity_id'];
            isOneToOne: false;
            referencedRelation: 'source_claims';
            referencedColumns: ['id', 'catalog_entity_id'];
          },
        ];
      };
      opportunity_risk_flags: {
        Row: {
          description: string;
          id: number;
          opportunity_id: number;
          risk_code: string;
          severity: string;
          source_claim_id: number;
        };
        ComputedFields: never;
        Insert: {
          description: string;
          id?: never;
          opportunity_id: number;
          risk_code: string;
          severity: string;
          source_claim_id: number;
        };
        Update: {
          description?: string;
          id?: never;
          opportunity_id?: number;
          risk_code?: string;
          severity?: string;
          source_claim_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'opportunity_risk_flags_opportunity_id_fkey';
            columns: ['opportunity_id'];
            isOneToOne: false;
            referencedRelation: 'opportunities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'opportunity_risk_flags_source_claim_id_opportunity_id_fkey';
            columns: ['source_claim_id', 'opportunity_id'];
            isOneToOne: false;
            referencedRelation: 'source_claims';
            referencedColumns: ['id', 'catalog_entity_id'];
          },
        ];
      };
      opportunity_tags: {
        Row: {
          code: string;
          is_active: boolean;
          label: string;
        };
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
      recommendation_events: {
        Row: {
          event_type: string;
          id: number;
          occurred_at: string;
          request_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          event_type: string;
          id?: never;
          occurred_at?: string;
          request_id: string;
          user_id: string;
        };
        Update: {
          event_type?: string;
          id?: never;
          occurred_at?: string;
          request_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recommendation_events_request_id_fkey';
            columns: ['request_id'];
            isOneToOne: false;
            referencedRelation: 'recommendation_requests';
            referencedColumns: ['id'];
          },
        ];
      };
      recommendation_requests: {
        Row: {
          application_id: string;
          context: string;
          created_at: string;
          due_date: string | null;
          expires_at: string;
          id: string;
          invited_email: string;
          letter_document_id: string | null;
          recommender_id: string | null;
          status: string;
          token_hash: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          application_id: string;
          context: string;
          created_at?: string;
          due_date?: string | null;
          expires_at?: string;
          id?: string;
          invited_email: string;
          letter_document_id?: string | null;
          recommender_id?: string | null;
          status?: string;
          token_hash?: string | null;
          user_id: string;
        };
        Update: {
          application_id?: string;
          context?: string;
          created_at?: string;
          due_date?: string | null;
          expires_at?: string;
          id?: string;
          invited_email?: string;
          letter_document_id?: string | null;
          recommender_id?: string | null;
          status?: string;
          token_hash?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recommendation_requests_application_id_user_id_fkey';
            columns: ['application_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'recommendation_requests_letter_document_id_fkey';
            columns: ['letter_document_id'];
            isOneToOne: false;
            referencedRelation: 'vault_documents';
            referencedColumns: ['id'];
          },
        ];
      };
      regions: {
        Row: {
          code: string;
          country_id: number;
          id: number;
          is_active: boolean;
          name: string;
        };
        ComputedFields: never;
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
        ComputedFields: never;
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
      roadmap_generation_runs: {
        Row: {
          change_summary: NonNullable<Json>;
          created_at: string;
          generation_version: string;
          id: string;
          input_hash: string;
          profile_version: number | null;
          roadmap_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          change_summary?: NonNullable<Json>;
          created_at?: string;
          generation_version: string;
          id?: string;
          input_hash: string;
          profile_version?: number | null;
          roadmap_id: string;
          user_id: string;
        };
        Update: {
          change_summary?: NonNullable<Json>;
          created_at?: string;
          generation_version?: string;
          id?: string;
          input_hash?: string;
          profile_version?: number | null;
          roadmap_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'roadmap_generation_runs_roadmap_id_user_id_fkey';
            columns: ['roadmap_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'roadmaps';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      roadmap_milestones: {
        Row: {
          created_at: string;
          description: string;
          generation_key: string;
          id: string;
          is_active: boolean;
          recommended_date: string | null;
          roadmap_id: string;
          sequence: number;
          target_id: string | null;
          title: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          description?: string;
          generation_key: string;
          id?: string;
          is_active?: boolean;
          recommended_date?: string | null;
          roadmap_id: string;
          sequence: number;
          target_id?: string | null;
          title: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          description?: string;
          generation_key?: string;
          id?: string;
          is_active?: boolean;
          recommended_date?: string | null;
          roadmap_id?: string;
          sequence?: number;
          target_id?: string | null;
          title?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'roadmap_milestones_roadmap_id_user_id_fkey';
            columns: ['roadmap_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'roadmaps';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'roadmap_milestones_target_id_roadmap_id_user_id_fkey';
            columns: ['target_id', 'roadmap_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'roadmap_targets';
            referencedColumns: ['id', 'roadmap_id', 'user_id'];
          },
        ];
      };
      roadmap_targets: {
        Row: {
          catalog_entity_id: number;
          created_at: string;
          detail_path: string;
          id: string;
          is_active: boolean;
          roadmap_id: string;
          target_type: string;
          title_snapshot: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          catalog_entity_id: number;
          created_at?: string;
          detail_path: string;
          id?: string;
          is_active?: boolean;
          roadmap_id: string;
          target_type: string;
          title_snapshot: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          catalog_entity_id?: number;
          created_at?: string;
          detail_path?: string;
          id?: string;
          is_active?: boolean;
          roadmap_id?: string;
          target_type?: string;
          title_snapshot?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'roadmap_targets_catalog_entity_id_fkey';
            columns: ['catalog_entity_id'];
            isOneToOne: false;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'roadmap_targets_roadmap_id_user_id_fkey';
            columns: ['roadmap_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'roadmaps';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      roadmap_task_dependencies: {
        Row: {
          created_at: string;
          dependency_type: string;
          depends_on_task_id: string;
          id: string;
          origin: string;
          roadmap_id: string;
          task_id: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          dependency_type?: string;
          depends_on_task_id: string;
          id?: string;
          origin?: string;
          roadmap_id: string;
          task_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          dependency_type?: string;
          depends_on_task_id?: string;
          id?: string;
          origin?: string;
          roadmap_id?: string;
          task_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'roadmap_task_dependencies_depends_on_task_id_roadmap_id_us_fkey';
            columns: ['depends_on_task_id', 'roadmap_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'roadmap_tasks';
            referencedColumns: ['id', 'roadmap_id', 'user_id'];
          },
          {
            foreignKeyName: 'roadmap_task_dependencies_roadmap_id_user_id_fkey';
            columns: ['roadmap_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'roadmaps';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'roadmap_task_dependencies_task_id_roadmap_id_user_id_fkey';
            columns: ['task_id', 'roadmap_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'roadmap_tasks';
            referencedColumns: ['id', 'roadmap_id', 'user_id'];
          },
        ];
      };
      roadmap_task_events: {
        Row: {
          created_at: string;
          event_type: string;
          from_status: string | null;
          id: number;
          roadmap_id: string;
          task_id: string;
          task_version: number;
          to_status: string | null;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          event_type: string;
          from_status?: string | null;
          id?: never;
          roadmap_id: string;
          task_id: string;
          task_version: number;
          to_status?: string | null;
          user_id: string;
        };
        Update: {
          created_at?: string;
          event_type?: string;
          from_status?: string | null;
          id?: never;
          roadmap_id?: string;
          task_id?: string;
          task_version?: number;
          to_status?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'roadmap_task_events_roadmap_id_user_id_fkey';
            columns: ['roadmap_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'roadmaps';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'roadmap_task_events_task_id_roadmap_id_user_id_fkey';
            columns: ['task_id', 'roadmap_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'roadmap_tasks';
            referencedColumns: ['id', 'roadmap_id', 'user_id'];
          },
        ];
      };
      roadmap_tasks: {
        Row: {
          completed_at: string | null;
          created_at: string;
          description: string;
          estimated_minutes: number;
          generated_priority: string;
          generation_key: string | null;
          id: string;
          is_mandatory: boolean;
          milestone_id: string | null;
          note: string | null;
          obsolete_at: string | null;
          official_deadline_at: string | null;
          official_deadline_date: string | null;
          official_deadline_precision: string;
          official_deadline_timezone: string | null;
          official_source_checked_at: string | null;
          official_source_url: string | null;
          origin: string;
          priority_override: string | null;
          recommended_due_date: string | null;
          roadmap_id: string;
          source_deadline_id: number | null;
          source_requirement_id: number | null;
          status: string;
          target_date: string | null;
          target_id: string | null;
          task_kind: string;
          title: string;
          updated_at: string;
          user_id: string;
          version: number;
          why_it_matters: string;
        };
        ComputedFields: never;
        Insert: {
          completed_at?: string | null;
          created_at?: string;
          description?: string;
          estimated_minutes?: number;
          generated_priority?: string;
          generation_key?: string | null;
          id?: string;
          is_mandatory?: boolean;
          milestone_id?: string | null;
          note?: string | null;
          obsolete_at?: string | null;
          official_deadline_at?: string | null;
          official_deadline_date?: string | null;
          official_deadline_precision?: string;
          official_deadline_timezone?: string | null;
          official_source_checked_at?: string | null;
          official_source_url?: string | null;
          origin: string;
          priority_override?: string | null;
          recommended_due_date?: string | null;
          roadmap_id: string;
          source_deadline_id?: number | null;
          source_requirement_id?: number | null;
          status?: string;
          target_date?: string | null;
          target_id?: string | null;
          task_kind: string;
          title: string;
          updated_at?: string;
          user_id: string;
          version?: number;
          why_it_matters?: string;
        };
        Update: {
          completed_at?: string | null;
          created_at?: string;
          description?: string;
          estimated_minutes?: number;
          generated_priority?: string;
          generation_key?: string | null;
          id?: string;
          is_mandatory?: boolean;
          milestone_id?: string | null;
          note?: string | null;
          obsolete_at?: string | null;
          official_deadline_at?: string | null;
          official_deadline_date?: string | null;
          official_deadline_precision?: string;
          official_deadline_timezone?: string | null;
          official_source_checked_at?: string | null;
          official_source_url?: string | null;
          origin?: string;
          priority_override?: string | null;
          recommended_due_date?: string | null;
          roadmap_id?: string;
          source_deadline_id?: number | null;
          source_requirement_id?: number | null;
          status?: string;
          target_date?: string | null;
          target_id?: string | null;
          task_kind?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
          version?: number;
          why_it_matters?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'roadmap_tasks_milestone_id_roadmap_id_user_id_fkey';
            columns: ['milestone_id', 'roadmap_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'roadmap_milestones';
            referencedColumns: ['id', 'roadmap_id', 'user_id'];
          },
          {
            foreignKeyName: 'roadmap_tasks_roadmap_id_user_id_fkey';
            columns: ['roadmap_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'roadmaps';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'roadmap_tasks_source_deadline_id_fkey';
            columns: ['source_deadline_id'];
            isOneToOne: false;
            referencedRelation: 'deadlines';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'roadmap_tasks_source_requirement_id_fkey';
            columns: ['source_requirement_id'];
            isOneToOne: false;
            referencedRelation: 'eligibility_requirements';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'roadmap_tasks_target_id_roadmap_id_user_id_fkey';
            columns: ['target_id', 'roadmap_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'roadmap_targets';
            referencedColumns: ['id', 'roadmap_id', 'user_id'];
          },
        ];
      };
      roadmaps: {
        Row: {
          availability_minutes_per_week: number;
          created_at: string;
          cycle_year: number;
          generation_version: string;
          id: string;
          last_generated_at: string | null;
          last_input_hash: string | null;
          status: string;
          timezone_name: string;
          title: string;
          updated_at: string;
          user_id: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          availability_minutes_per_week?: number;
          created_at?: string;
          cycle_year: number;
          generation_version?: string;
          id?: string;
          last_generated_at?: string | null;
          last_input_hash?: string | null;
          status?: string;
          timezone_name: string;
          title?: string;
          updated_at?: string;
          user_id: string;
          version?: number;
        };
        Update: {
          availability_minutes_per_week?: number;
          created_at?: string;
          cycle_year?: number;
          generation_version?: string;
          id?: string;
          last_generated_at?: string | null;
          last_input_hash?: string | null;
          status?: string;
          timezone_name?: string;
          title?: string;
          updated_at?: string;
          user_id?: string;
          version?: number;
        };
        Relationships: [];
      };
      saved_catalog_items: {
        Row: {
          catalog_entity_id: number;
          created_at: string;
          id: string;
          list_name: string;
          note: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          catalog_entity_id: number;
          created_at?: string;
          id?: string;
          list_name?: string;
          note?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          catalog_entity_id?: number;
          created_at?: string;
          id?: string;
          list_name?: string;
          note?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_catalog_items_catalog_entity_id_fkey';
            columns: ['catalog_entity_id'];
            isOneToOne: false;
            referencedRelation: 'catalog_entities';
            referencedColumns: ['id'];
          },
        ];
      };
      saved_searches: {
        Row: {
          created_at: string;
          filters: NonNullable<Json>;
          fingerprint: string | null;
          id: string;
          name: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          filters: NonNullable<Json>;
          fingerprint?: never;
          id?: string;
          name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          filters?: NonNullable<Json>;
          fingerprint?: never;
          id?: string;
          name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      scholarship_application_details: {
        Row: {
          admissions_linkage: string;
          application_method: string;
          application_url: string | null;
          instructions: string | null;
          scholarship_id: number;
          source_claim_id: number | null;
          updated_at: string;
        };
        ComputedFields: never;
        Insert: {
          admissions_linkage?: string;
          application_method?: string;
          application_url?: string | null;
          instructions?: string | null;
          scholarship_id: number;
          source_claim_id?: number | null;
          updated_at?: string;
        };
        Update: {
          admissions_linkage?: string;
          application_method?: string;
          application_url?: string | null;
          instructions?: string | null;
          scholarship_id?: number;
          source_claim_id?: number | null;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scholarship_application_claim_parent';
            columns: ['source_claim_id', 'scholarship_id'];
            isOneToOne: false;
            referencedRelation: 'source_claims';
            referencedColumns: ['id', 'catalog_entity_id'];
          },
          {
            foreignKeyName: 'scholarship_application_details_scholarship_id_fkey';
            columns: ['scholarship_id'];
            isOneToOne: true;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['scholarship_id'];
          },
          {
            foreignKeyName: 'scholarship_application_details_scholarship_id_fkey';
            columns: ['scholarship_id'];
            isOneToOne: true;
            referencedRelation: 'scholarships';
            referencedColumns: ['id'];
          },
        ];
      };
      scholarship_application_events: {
        Row: {
          actor_id: string;
          evidence: string | null;
          from_status: string | null;
          id: number;
          idempotency_key: string;
          occurred_at: string;
          reason: string | null;
          scholarship_application_id: string;
          source_type: string;
          to_status: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          actor_id: string;
          evidence?: string | null;
          from_status?: string | null;
          id?: never;
          idempotency_key: string;
          occurred_at?: string;
          reason?: string | null;
          scholarship_application_id: string;
          source_type: string;
          to_status: string;
          user_id: string;
        };
        Update: {
          actor_id?: string;
          evidence?: string | null;
          from_status?: string | null;
          id?: never;
          idempotency_key?: string;
          occurred_at?: string;
          reason?: string | null;
          scholarship_application_id?: string;
          source_type?: string;
          to_status?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'scholarship_application_event_scholarship_application_id_u_fkey';
            columns: ['scholarship_application_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'scholarship_applications';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      scholarship_applications: {
        Row: {
          application_id: string | null;
          created_at: string;
          cycle_year: number;
          deadline_at: string | null;
          deadline_date: string | null;
          deadline_precision: string;
          deadline_timezone: string | null;
          id: string;
          notes: string;
          official_portal_url: string | null;
          scholarship_cycle_id: number | null;
          scholarship_id: number;
          scholarship_title_snapshot: string;
          source_url: string | null;
          status: string;
          submission_evidence: string | null;
          submission_provenance: string | null;
          submitted_at: string | null;
          updated_at: string;
          user_id: string;
          user_reference_id: string | null;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          application_id?: string | null;
          created_at?: string;
          cycle_year: number;
          deadline_at?: string | null;
          deadline_date?: string | null;
          deadline_precision?: string;
          deadline_timezone?: string | null;
          id?: string;
          notes?: string;
          official_portal_url?: string | null;
          scholarship_cycle_id?: number | null;
          scholarship_id: number;
          scholarship_title_snapshot: string;
          source_url?: string | null;
          status?: string;
          submission_evidence?: string | null;
          submission_provenance?: string | null;
          submitted_at?: string | null;
          updated_at?: string;
          user_id: string;
          user_reference_id?: string | null;
          version?: number;
        };
        Update: {
          application_id?: string | null;
          created_at?: string;
          cycle_year?: number;
          deadline_at?: string | null;
          deadline_date?: string | null;
          deadline_precision?: string;
          deadline_timezone?: string | null;
          id?: string;
          notes?: string;
          official_portal_url?: string | null;
          scholarship_cycle_id?: number | null;
          scholarship_id?: number;
          scholarship_title_snapshot?: string;
          source_url?: string | null;
          status?: string;
          submission_evidence?: string | null;
          submission_provenance?: string | null;
          submitted_at?: string | null;
          updated_at?: string;
          user_id?: string;
          user_reference_id?: string | null;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'scholarship_applications_application_id_user_id_fkey';
            columns: ['application_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'scholarship_applications_scholarship_cycle_id_fkey';
            columns: ['scholarship_cycle_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['scholarship_cycle_id'];
          },
          {
            foreignKeyName: 'scholarship_applications_scholarship_cycle_id_fkey';
            columns: ['scholarship_cycle_id'];
            isOneToOne: false;
            referencedRelation: 'scholarship_cycles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'scholarship_applications_scholarship_id_fkey';
            columns: ['scholarship_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['scholarship_id'];
          },
          {
            foreignKeyName: 'scholarship_applications_scholarship_id_fkey';
            columns: ['scholarship_id'];
            isOneToOne: false;
            referencedRelation: 'scholarships';
            referencedColumns: ['id'];
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
      scholarship_document_requirements: {
        Row: {
          document_name: string;
          id: number;
          requirement_state: string;
          scholarship_cycle_id: number;
          source_claim_id: number | null;
        };
        ComputedFields: never;
        Insert: {
          document_name: string;
          id?: never;
          requirement_state?: string;
          scholarship_cycle_id: number;
          source_claim_id?: number | null;
        };
        Update: {
          document_name?: string;
          id?: never;
          requirement_state?: string;
          scholarship_cycle_id?: number;
          source_claim_id?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'scholarship_document_claim_parent';
            columns: ['source_claim_id', 'scholarship_cycle_id'];
            isOneToOne: false;
            referencedRelation: 'source_claims';
            referencedColumns: ['id', 'catalog_entity_id'];
          },
          {
            foreignKeyName: 'scholarship_document_requirements_scholarship_cycle_id_fkey';
            columns: ['scholarship_cycle_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['scholarship_cycle_id'];
          },
          {
            foreignKeyName: 'scholarship_document_requirements_scholarship_cycle_id_fkey';
            columns: ['scholarship_cycle_id'];
            isOneToOne: false;
            referencedRelation: 'scholarship_cycles';
            referencedColumns: ['id'];
          },
        ];
      };
      scholarship_editor_memberships: {
        Row: {
          granted_at: string;
          granted_by: string | null;
          role: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          granted_at?: string;
          granted_by?: string | null;
          role: string;
          user_id: string;
        };
        Update: {
          granted_at?: string;
          granted_by?: string | null;
          role?: string;
          user_id?: string;
        };
        Relationships: [];
      };
      scholarship_editor_notes: {
        Row: {
          note: string;
          scholarship_id: number;
          updated_at: string;
          updated_by: string | null;
        };
        ComputedFields: never;
        Insert: {
          note: string;
          scholarship_id: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: {
          note?: string;
          scholarship_id?: number;
          updated_at?: string;
          updated_by?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'scholarship_editor_notes_scholarship_id_fkey';
            columns: ['scholarship_id'];
            isOneToOne: true;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['scholarship_id'];
          },
          {
            foreignKeyName: 'scholarship_editor_notes_scholarship_id_fkey';
            columns: ['scholarship_id'];
            isOneToOne: true;
            referencedRelation: 'scholarships';
            referencedColumns: ['id'];
          },
        ];
      };
      scholarship_editorial_events: {
        Row: {
          action: string;
          actor_id: string | null;
          created_at: string;
          id: number;
          note: string | null;
          scholarship_id: number;
        };
        ComputedFields: never;
        Insert: {
          action: string;
          actor_id?: string | null;
          created_at?: string;
          id?: never;
          note?: string | null;
          scholarship_id: number;
        };
        Update: {
          action?: string;
          actor_id?: string | null;
          created_at?: string;
          id?: never;
          note?: string | null;
          scholarship_id?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'scholarship_editorial_events_scholarship_id_fkey';
            columns: ['scholarship_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['scholarship_id'];
          },
          {
            foreignKeyName: 'scholarship_editorial_events_scholarship_id_fkey';
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
        ComputedFields: never;
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
      scholarship_funding_profiles: {
        Row: {
          annual_change_note: string | null;
          duration_note: string | null;
          funding_label: string;
          renewal_conditions: string | null;
          scholarship_id: number;
          source_claim_id: number | null;
          uncovered_costs_note: string | null;
        };
        ComputedFields: never;
        Insert: {
          annual_change_note?: string | null;
          duration_note?: string | null;
          funding_label?: string;
          renewal_conditions?: string | null;
          scholarship_id: number;
          source_claim_id?: number | null;
          uncovered_costs_note?: string | null;
        };
        Update: {
          annual_change_note?: string | null;
          duration_note?: string | null;
          funding_label?: string;
          renewal_conditions?: string | null;
          scholarship_id?: number;
          source_claim_id?: number | null;
          uncovered_costs_note?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'scholarship_funding_claim_parent';
            columns: ['source_claim_id', 'scholarship_id'];
            isOneToOne: false;
            referencedRelation: 'source_claims';
            referencedColumns: ['id', 'catalog_entity_id'];
          },
          {
            foreignKeyName: 'scholarship_funding_profiles_scholarship_id_fkey';
            columns: ['scholarship_id'];
            isOneToOne: true;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['scholarship_id'];
          },
          {
            foreignKeyName: 'scholarship_funding_profiles_scholarship_id_fkey';
            columns: ['scholarship_id'];
            isOneToOne: true;
            referencedRelation: 'scholarships';
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
        ComputedFields: never;
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
          provider_country_code: string | null;
          provider_institution_id: number | null;
          provider_name: string | null;
          slug: string;
          title: string;
        };
        ComputedFields: never;
        Insert: {
          award_type: string;
          financial_aid_scheme_id?: number | null;
          id: number;
          official_url: string;
          provider_country_code?: string | null;
          provider_institution_id?: number | null;
          provider_name?: string | null;
          slug: string;
          title: string;
        };
        Update: {
          award_type?: string;
          financial_aid_scheme_id?: number | null;
          id?: number;
          official_url?: string;
          provider_country_code?: string | null;
          provider_institution_id?: number | null;
          provider_name?: string | null;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
        ComputedFields: never;
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
      student_opportunity_plan_actions: {
        Row: {
          created_at: string;
          id: string;
          note: string | null;
          opportunity_id: number;
          status: string;
          target_date: string | null;
          updated_at: string;
          user_id: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          id?: string;
          note?: string | null;
          opportunity_id: number;
          status?: string;
          target_date?: string | null;
          updated_at?: string;
          user_id: string;
          version?: number;
        };
        Update: {
          created_at?: string;
          id?: string;
          note?: string | null;
          opportunity_id?: number;
          status?: string;
          target_date?: string | null;
          updated_at?: string;
          user_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'student_opportunity_plan_actions_opportunity_id_fkey';
            columns: ['opportunity_id'];
            isOneToOne: false;
            referencedRelation: 'opportunities';
            referencedColumns: ['id'];
          },
        ];
      };
      student_opportunity_reminders: {
        Row: {
          channel: string;
          created_at: string;
          id: string;
          opportunity_id: number;
          remind_at: string;
          status: string;
          timezone_name: string;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          channel?: string;
          created_at?: string;
          id?: string;
          opportunity_id: number;
          remind_at: string;
          status?: string;
          timezone_name: string;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          channel?: string;
          created_at?: string;
          id?: string;
          opportunity_id?: number;
          remind_at?: string;
          status?: string;
          timezone_name?: string;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_opportunity_reminders_opportunity_id_fkey';
            columns: ['opportunity_id'];
            isOneToOne: false;
            referencedRelation: 'opportunities';
            referencedColumns: ['id'];
          },
        ];
      };
      student_opportunity_saves: {
        Row: {
          created_at: string;
          opportunity_id: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          opportunity_id: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          opportunity_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_opportunity_saves_opportunity_id_fkey';
            columns: ['opportunity_id'];
            isOneToOne: false;
            referencedRelation: 'opportunities';
            referencedColumns: ['id'];
          },
        ];
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
        ComputedFields: never;
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
          document: NonNullable<Json>;
          saved_at: string;
          user_id: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          document: NonNullable<Json>;
          saved_at?: string;
          user_id: string;
          version: number;
        };
        Update: {
          document?: NonNullable<Json>;
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
          document: NonNullable<Json>;
          updated_at: string;
          user_id: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          document?: NonNullable<Json>;
          updated_at?: string;
          user_id: string;
          version?: number;
        };
        Update: {
          document?: NonNullable<Json>;
          updated_at?: string;
          user_id?: string;
          version?: number;
        };
        Relationships: [];
      };
      student_scholarship_saves: {
        Row: {
          created_at: string;
          scholarship_id: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          scholarship_id: number;
          user_id: string;
        };
        Update: {
          created_at?: string;
          scholarship_id?: number;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_scholarship_saves_scholarship_id_fkey';
            columns: ['scholarship_id'];
            isOneToOne: false;
            referencedRelation: 'published_scholarship_opportunities';
            referencedColumns: ['scholarship_id'];
          },
          {
            foreignKeyName: 'student_scholarship_saves_scholarship_id_fkey';
            columns: ['scholarship_id'];
            isOneToOne: false;
            referencedRelation: 'scholarships';
            referencedColumns: ['id'];
          },
        ];
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
        ComputedFields: never;
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
        ComputedFields: never;
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
      vault_documents: {
        Row: {
          archived_at: string | null;
          category: string;
          created_at: string;
          current_version_id: string | null;
          deleted_at: string | null;
          display_name: string;
          expires_at: string;
          id: string;
          portfolio_url: string | null;
          purged_at: string | null;
          purpose: string;
          purpose_application_id: string | null;
          sensitivity: string;
          source_draft_id: string | null;
          updated_at: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          archived_at?: string | null;
          category: string;
          created_at?: string;
          current_version_id?: string | null;
          deleted_at?: string | null;
          display_name: string;
          expires_at: string;
          id?: string;
          portfolio_url?: string | null;
          purged_at?: string | null;
          purpose?: string;
          purpose_application_id?: string | null;
          sensitivity: string;
          source_draft_id?: string | null;
          updated_at?: string;
          user_id: string;
        };
        Update: {
          archived_at?: string | null;
          category?: string;
          created_at?: string;
          current_version_id?: string | null;
          deleted_at?: string | null;
          display_name?: string;
          expires_at?: string;
          id?: string;
          portfolio_url?: string | null;
          purged_at?: string | null;
          purpose?: string;
          purpose_application_id?: string | null;
          sensitivity?: string;
          source_draft_id?: string | null;
          updated_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vault_current_version_fk';
            columns: ['current_version_id', 'id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'vault_versions';
            referencedColumns: ['id', 'document_id', 'user_id'];
          },
          {
            foreignKeyName: 'vault_documents_purpose_application_id_user_id_fkey';
            columns: ['purpose_application_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'vault_documents_source_draft_id_user_id_fkey';
            columns: ['source_draft_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'writing_drafts';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      vault_events: {
        Row: {
          created_at: string;
          document_id: string;
          event_type: string;
          id: number;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          document_id: string;
          event_type: string;
          id?: never;
          user_id: string;
        };
        Update: {
          created_at?: string;
          document_id?: string;
          event_type?: string;
          id?: never;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vault_events_document_id_fkey';
            columns: ['document_id'];
            isOneToOne: false;
            referencedRelation: 'vault_documents';
            referencedColumns: ['id'];
          },
        ];
      };
      vault_links: {
        Row: {
          application_id: string;
          created_at: string;
          document_id: string;
          id: string;
          task_id: string | null;
          user_id: string;
          version_id: string;
        };
        ComputedFields: never;
        Insert: {
          application_id: string;
          created_at?: string;
          document_id: string;
          id?: string;
          task_id?: string | null;
          user_id: string;
          version_id: string;
        };
        Update: {
          application_id?: string;
          created_at?: string;
          document_id?: string;
          id?: string;
          task_id?: string | null;
          user_id?: string;
          version_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vault_links_application_id_user_id_fkey';
            columns: ['application_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'vault_links_document_id_user_id_fkey';
            columns: ['document_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'vault_documents';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'vault_links_task_id_user_id_fkey';
            columns: ['task_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'roadmap_tasks';
            referencedColumns: ['id', 'user_id'];
          },
          {
            foreignKeyName: 'vault_links_version_id_document_id_user_id_fkey';
            columns: ['version_id', 'document_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'vault_versions';
            referencedColumns: ['id', 'document_id', 'user_id'];
          },
        ];
      };
      vault_versions: {
        Row: {
          byte_size: number;
          created_at: string;
          document_id: string;
          extension: string;
          id: string;
          mime: string;
          next_scan_at: string;
          object_path: string;
          request_fingerprint: string | null;
          scan_attempts: number;
          scanned_at: string | null;
          scanner: string | null;
          sequence: number;
          sha256: string;
          state: string;
          user_id: string;
        };
        ComputedFields: never;
        Insert: {
          byte_size: number;
          created_at?: string;
          document_id: string;
          extension: string;
          id: string;
          mime: string;
          next_scan_at?: string;
          object_path: string;
          request_fingerprint?: string | null;
          scan_attempts?: number;
          scanned_at?: string | null;
          scanner?: string | null;
          sequence: number;
          sha256: string;
          state?: string;
          user_id: string;
        };
        Update: {
          byte_size?: number;
          created_at?: string;
          document_id?: string;
          extension?: string;
          id?: string;
          mime?: string;
          next_scan_at?: string;
          object_path?: string;
          request_fingerprint?: string | null;
          scan_attempts?: number;
          scanned_at?: string | null;
          scanner?: string | null;
          sequence?: number;
          sha256?: string;
          state?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'vault_versions_document_id_user_id_fkey';
            columns: ['document_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'vault_documents';
            referencedColumns: ['id', 'user_id'];
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
        ComputedFields: never;
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
        ComputedFields: never;
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
      writing_drafts: {
        Row: {
          application_id: string | null;
          content: string;
          created_at: string;
          id: string;
          kind: string;
          prompt: string;
          rubric: NonNullable<Json>;
          title: string;
          updated_at: string;
          user_id: string;
          version: number;
          word_limit: number | null;
        };
        ComputedFields: never;
        Insert: {
          application_id?: string | null;
          content?: string;
          created_at?: string;
          id?: string;
          kind: string;
          prompt?: string;
          rubric?: NonNullable<Json>;
          title: string;
          updated_at?: string;
          user_id: string;
          version?: number;
          word_limit?: number | null;
        };
        Update: {
          application_id?: string | null;
          content?: string;
          created_at?: string;
          id?: string;
          kind?: string;
          prompt?: string;
          rubric?: NonNullable<Json>;
          title?: string;
          updated_at?: string;
          user_id?: string;
          version?: number;
          word_limit?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'writing_drafts_application_id_user_id_fkey';
            columns: ['application_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'applications';
            referencedColumns: ['id', 'user_id'];
          },
        ];
      };
      writing_versions: {
        Row: {
          created_at: string;
          draft_id: string;
          id: string;
          request_id: string;
          snapshot: NonNullable<Json>;
          user_id: string;
          version: number;
        };
        ComputedFields: never;
        Insert: {
          created_at?: string;
          draft_id: string;
          id?: string;
          request_id: string;
          snapshot: NonNullable<Json>;
          user_id: string;
          version: number;
        };
        Update: {
          created_at?: string;
          draft_id?: string;
          id?: string;
          request_id?: string;
          snapshot?: NonNullable<Json>;
          user_id?: string;
          version?: number;
        };
        Relationships: [
          {
            foreignKeyName: 'writing_versions_draft_id_user_id_fkey';
            columns: ['draft_id', 'user_id'];
            isOneToOne: false;
            referencedRelation: 'writing_drafts';
            referencedColumns: ['id', 'user_id'];
          },
        ];
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
        ComputedFields: never;
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
        ComputedFields: never;
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
      application_add_scholarship: {
        Args: {
          p_application_id: string;
          p_cycle_year: number;
          p_idempotency_key: string;
          p_scholarship_cycle_id: number;
          p_scholarship_id: number;
        };
        Returns: {
          application_id: string | null;
          created_at: string;
          cycle_year: number;
          deadline_at: string | null;
          deadline_date: string | null;
          deadline_precision: string;
          deadline_timezone: string | null;
          id: string;
          notes: string;
          official_portal_url: string | null;
          scholarship_cycle_id: number | null;
          scholarship_id: number;
          scholarship_title_snapshot: string;
          source_url: string | null;
          status: string;
          submission_evidence: string | null;
          submission_provenance: string | null;
          submitted_at: string | null;
          updated_at: string;
          user_id: string;
          user_reference_id: string | null;
          version: number;
        };
        SetofOptions: {
          from: '*';
          to: 'scholarship_applications';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      application_checklist_change: {
        Args: {
          p_application_id: string;
          p_expected_version: number;
          p_is_mandatory: boolean;
          p_item_id: string;
          p_status: string;
          p_title: string;
        };
        Returns: {
          application_id: string;
          checklist_key: string | null;
          completed_at: string | null;
          created_at: string;
          id: string;
          is_mandatory: boolean;
          origin: string;
          roadmap_task_id: string | null;
          sort_order: number;
          source_claim_id: number | null;
          status: string;
          title: string;
          updated_at: string;
          user_id: string;
          verification_state: string;
          version: number;
        };
        SetofOptions: {
          from: '*';
          to: 'application_checklist_items';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      application_create: {
        Args: {
          p_cycle_year: number;
          p_idempotency_key: string;
          p_intake_id: number;
          p_program_id: number;
        };
        Returns: {
          application_fee_amount: number | null;
          application_fee_currency: string | null;
          archived_at: string | null;
          country_code_snapshot: string | null;
          created_at: string;
          cycle_year: number;
          degree_level_snapshot: string;
          fee_waiver_state: string;
          id: string;
          institution_name_snapshot: string;
          intake_id: number | null;
          notes: string;
          official_deadline_at: string | null;
          official_deadline_date: string | null;
          official_deadline_precision: string;
          official_deadline_timezone: string | null;
          official_portal_url: string | null;
          priority: string;
          program_id: number;
          program_source_checked_at: string | null;
          program_source_url: string | null;
          program_title_snapshot: string;
          roadmap_submission_task_id: string | null;
          status: string;
          submission_evidence: string | null;
          submission_provenance: string | null;
          submitted_at: string | null;
          updated_at: string;
          user_id: string;
          user_reference_id: string | null;
          version: number;
        };
        SetofOptions: {
          from: '*';
          to: 'applications';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      application_transition: {
        Args: {
          p_application_id: string;
          p_evidence: string;
          p_expected_version: number;
          p_idempotency_key: string;
          p_reason: string;
          p_to_status: string;
          p_user_confirmed: boolean;
        };
        Returns: {
          application_fee_amount: number | null;
          application_fee_currency: string | null;
          archived_at: string | null;
          country_code_snapshot: string | null;
          created_at: string;
          cycle_year: number;
          degree_level_snapshot: string;
          fee_waiver_state: string;
          id: string;
          institution_name_snapshot: string;
          intake_id: number | null;
          notes: string;
          official_deadline_at: string | null;
          official_deadline_date: string | null;
          official_deadline_precision: string;
          official_deadline_timezone: string | null;
          official_portal_url: string | null;
          priority: string;
          program_id: number;
          program_source_checked_at: string | null;
          program_source_url: string | null;
          program_title_snapshot: string;
          roadmap_submission_task_id: string | null;
          status: string;
          submission_evidence: string | null;
          submission_provenance: string | null;
          submitted_at: string | null;
          updated_at: string;
          user_id: string;
          user_reference_id: string | null;
          version: number;
        };
        SetofOptions: {
          from: '*';
          to: 'applications';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      application_update_metadata: {
        Args: {
          p_application_id: string;
          p_expected_version: number;
          p_notes: string;
          p_priority: string;
          p_user_reference_id: string;
        };
        Returns: {
          application_fee_amount: number | null;
          application_fee_currency: string | null;
          archived_at: string | null;
          country_code_snapshot: string | null;
          created_at: string;
          cycle_year: number;
          degree_level_snapshot: string;
          fee_waiver_state: string;
          id: string;
          institution_name_snapshot: string;
          intake_id: number | null;
          notes: string;
          official_deadline_at: string | null;
          official_deadline_date: string | null;
          official_deadline_precision: string;
          official_deadline_timezone: string | null;
          official_portal_url: string | null;
          priority: string;
          program_id: number;
          program_source_checked_at: string | null;
          program_source_url: string | null;
          program_title_snapshot: string;
          roadmap_submission_task_id: string | null;
          status: string;
          submission_evidence: string | null;
          submission_provenance: string | null;
          submitted_at: string | null;
          updated_at: string;
          user_id: string;
          user_reference_id: string | null;
          version: number;
        };
        SetofOptions: {
          from: '*';
          to: 'applications';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      assert_catalog_entity_evidence: {
        Args: { target_entity_id: number };
        Returns: undefined;
      };
      catalog_editor_command: { Args: { p_command: Json }; Returns: Json };
      catalog_editor_queue: { Args: { p_before_id?: number }; Returns: Json };
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
      opportunity_search: {
        Args: { p_filters?: Json };
        Returns: {
          age_fit: string;
          cost_amount_max: number;
          cost_amount_min: number;
          cost_currency_code: string;
          cost_state: string;
          country_code: string;
          deadline_at: string;
          deadline_timezone: string;
          eligibility_age_max: number;
          eligibility_age_min: number;
          eligibility_grade_max: number;
          eligibility_grade_min: number;
          eligibility_summary: string;
          ends_on: string;
          grade_fit: string;
          id: number;
          location_text: string;
          official_application_url: string;
          opportunity_type: string;
          participation_format: string;
          provider_name: string;
          risk_summary: string;
          slug: string;
          source_checked_at: string;
          source_url: string;
          sponsor_name: string;
          starts_on: string;
          summary: string;
          tags: string[];
          title: string;
          total_count: number;
        }[];
      };
      publish_catalog_entity: {
        Args: { p_catalog_entity_id: number; p_checked_at: string };
        Returns: number;
      };
      recommendation_cancel: { Args: { p_id: string }; Returns: undefined };
      recommendation_create: {
        Args: {
          p_application_id: string;
          p_context: string;
          p_due_date: string;
          p_email: string;
          p_token_hash: string;
        };
        Returns: string;
      };
      recommendation_received: {
        Args: Record<PropertyKey, never>;
        Returns: {
          context: string;
          due_date: string;
          expires_at: string;
          id: string;
          status: string;
        }[];
      };
      recommendation_respond: {
        Args: { p_accept: boolean; p_token_hash: string };
        Returns: string;
      };
      review_source_claim: {
        Args: { p_claim_id: number; p_verification_run_id: number };
        Returns: number;
      };
      roadmap_apply_generation: {
        Args: {
          p_availability_minutes_per_week: number;
          p_cycle_year: number;
          p_dependencies: Json;
          p_generation_version: string;
          p_input_hash: string;
          p_milestones: Json;
          p_profile_version: number;
          p_targets: Json;
          p_tasks: Json;
          p_timezone_name: string;
          p_user_id: string;
        };
        Returns: Json;
      };
      scholarship_application_transition: {
        Args: {
          p_evidence: string;
          p_expected_version: number;
          p_idempotency_key: string;
          p_reason: string;
          p_scholarship_application_id: string;
          p_to_status: string;
          p_user_confirmed: boolean;
        };
        Returns: {
          application_id: string | null;
          created_at: string;
          cycle_year: number;
          deadline_at: string | null;
          deadline_date: string | null;
          deadline_precision: string;
          deadline_timezone: string | null;
          id: string;
          notes: string;
          official_portal_url: string | null;
          scholarship_cycle_id: number | null;
          scholarship_id: number;
          scholarship_title_snapshot: string;
          source_url: string | null;
          status: string;
          submission_evidence: string | null;
          submission_provenance: string | null;
          submitted_at: string | null;
          updated_at: string;
          user_id: string;
          user_reference_id: string | null;
          version: number;
        };
        SetofOptions: {
          from: '*';
          to: 'scholarship_applications';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      scholarship_create_draft: {
        Args: { p_actor: string; p_bundle: Json };
        Returns: number;
      };
      scholarship_editor_create_draft: {
        Args: { p_bundle: Json };
        Returns: number;
      };
      scholarship_editor_list: {
        Args: Record<PropertyKey, never>;
        Returns: {
          id: number;
          publication_status_code: string;
          slug: string;
          title: string;
          verification_state_code: string;
        }[];
      };
      scholarship_editor_preview: {
        Args: { p_slug: string };
        Returns: boolean;
      };
      scholarship_editor_transition: {
        Args: { p_action: string; p_id: number; p_note?: string };
        Returns: number;
      };
      scholarship_search: {
        Args: {
          p_award_type?: string;
          p_country?: string;
          p_limit?: number;
          p_offset?: number;
          p_query?: string;
          p_slug?: string;
          p_sort?: string;
        };
        Returns: {
          award_type: string;
          benefit_summary: string;
          deadline_at: string;
          deadline_timezone: string;
          id: number;
          official_url: string;
          provider_country_code: string;
          provider_name: string;
          slug: string;
          source_checked_at: string;
          source_url: string;
          title: string;
          total_count: number;
        }[];
      };
      scholarship_transition: {
        Args: {
          p_action: string;
          p_actor: string;
          p_id: number;
          p_note?: string;
        };
        Returns: number;
      };
      unified_catalog_search: {
        Args: { p_filters?: Json };
        Returns: {
          category: string;
          cost_amount_max: number;
          cost_amount_min: number;
          cost_currency: string;
          cost_period: string;
          cost_state: string;
          country_code: string;
          deadline_at: string;
          degree_level: string;
          delivery_format: string;
          detail_path: string;
          eligibility_state: string;
          entity_id: number;
          entity_type: string;
          funding_label: string;
          has_funding: boolean;
          relevance: number;
          slug: string;
          source_checked_at: string;
          source_freshness: string;
          source_url: string;
          subtitle: string;
          title: string;
          total_count: number;
          type_counts: Json;
        }[];
      };
      vault_draft_origin: {
        Args: { p_document_id: string; p_draft_id: string };
        Returns: undefined;
      };
      vault_finish: {
        Args: { p_failed?: boolean; p_version_id: string };
        Returns: undefined;
      };
      vault_link: {
        Args: {
          p_application_id: string;
          p_document_id: string;
          p_remove?: boolean;
          p_task_id: string;
          p_version_id: string;
        };
        Returns: undefined;
      };
      vault_manage: {
        Args: { p_action: string; p_document_id: string };
        Returns: undefined;
      };
      vault_portfolio: {
        Args: { p_name: string; p_url: string };
        Returns: string;
      };
      vault_reserve: {
        Args: {
          p_application_id: string;
          p_category: string;
          p_document_id: string;
          p_extension: string;
          p_mime: string;
          p_name: string;
          p_purpose: string;
          p_recommendation_id?: string;
          p_request_id: string;
          p_sha256: string;
          p_size: number;
        };
        Returns: {
          byte_size: number;
          created_at: string;
          document_id: string;
          extension: string;
          id: string;
          mime: string;
          next_scan_at: string;
          object_path: string;
          request_fingerprint: string | null;
          scan_attempts: number;
          scanned_at: string | null;
          scanner: string | null;
          sequence: number;
          sha256: string;
          state: string;
          user_id: string;
        };
        SetofOptions: {
          from: '*';
          to: 'vault_versions';
          isOneToOne: true;
          isSetofReturn: false;
        };
      };
      vault_scan_result: {
        Args: {
          p_clean: boolean;
          p_scanner: string;
          p_sha256: string;
          p_version_id: string;
        };
        Returns: undefined;
      };
      writing_delete: {
        Args: { p_expected_version: number; p_id: string };
        Returns: undefined;
      };
      writing_save: {
        Args: {
          p_application_id: string;
          p_content: string;
          p_expected_version: number;
          p_id: string;
          p_kind: string;
          p_prompt: string;
          p_request_id: string;
          p_rubric: Json;
          p_title: string;
          p_word_limit: number;
        };
        Returns: {
          application_id: string | null;
          content: string;
          created_at: string;
          id: string;
          kind: string;
          prompt: string;
          rubric: NonNullable<Json>;
          title: string;
          updated_at: string;
          user_id: string;
          version: number;
          word_limit: number | null;
        };
        SetofOptions: {
          from: '*';
          to: 'writing_drafts';
          isOneToOne: true;
          isSetofReturn: false;
        };
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
