import {
  addCustomer,
  deleteCustomer,
  fetchCustomers,
  updateCustomer,
} from './helpers';
import { CustomerModel } from '../../models';
import { baseApi } from './baseApi';

export const customersApiSlice = baseApi.injectEndpoints({
  endpoints: (builder) => ({
    getCustomers: builder.query<CustomerModel[], void>({
      async queryFn() {
        try {
          const data = await fetchCustomers();
          return { data };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to fetch customers',
          };
        }
      },
      providesTags: ['Customers'],
    }),

    addCustomer: builder.mutation<
      CustomerModel,
      Partial<CustomerModel> & { name: string }
    >({
      async queryFn(customer) {
        try {
          const data = await addCustomer(customer);
          return { data };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to add customer',
          };
        }
      },
      invalidatesTags: ['Customers', 'SyncStatus'],
    }),

    updateCustomer: builder.mutation<
      void,
      { id: string; data: Partial<CustomerModel> }
    >({
      async queryFn({ id, data }) {
        try {
          await updateCustomer(id, data);
          return { data: undefined };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to update customer',
          };
        }
      },
      invalidatesTags: ['Customers', 'SyncStatus'],
    }),

    deleteCustomer: builder.mutation<void, string>({
      async queryFn(id) {
        try {
          await deleteCustomer(id);
          return { data: undefined };
        } catch (error) {
          return {
            error: (error as Error).message || 'Failed to delete customer',
          };
        }
      },
      invalidatesTags: ['Customers', 'SyncStatus'],
    }),
  }),
  overrideExisting: false,
});

export const {
  useGetCustomersQuery,
  useAddCustomerMutation,
  useUpdateCustomerMutation,
  useDeleteCustomerMutation,
} = customersApiSlice;
