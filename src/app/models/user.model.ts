import { Address } from './address.model';

export interface User {
    id: number;
    firstName: string;
    lastName: string;
    age: number;
    email: string;
    phone: string;
    address: Address;
    isHighlighted?: boolean;
    image?: string;
    company?: {
        name: string;
        department: string;
        title: string;
    };
}
