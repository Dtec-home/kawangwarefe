/**
 * Category Admins Management Page
 *
 * Allows assigning and managing admin roles for specific contribution categories
 */

"use client";

import { useState } from "react";
import { useQuery, useMutation } from "@apollo/client/react";
import { GET_CONTRIBUTION_CATEGORIES } from "@/lib/graphql/queries";
import { GET_MEMBERS_LIST } from "@/lib/graphql/admin-queries";
import {
  GET_CATEGORY_ADMINS,
  ASSIGN_CATEGORY_ADMIN,
  REMOVE_CATEGORY_ADMIN,
} from "@/lib/graphql/category-admin-queries";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { AdminLayout } from "@/components/layouts/admin-layout";
import { AdminProtectedRoute } from "@/components/auth/admin-protected-route";
import {
  Shield,
  UserPlus,
  Trash2,
  Search,
  Users,
  FolderKey,
} from "lucide-react";
import toast from "react-hot-toast";

interface Category {
  id: string;
  name: string;
  code: string;
  description: string;
  isActive: boolean;
}

interface Member {
  id: string;
  fullName: string;
  phoneNumber: string;
  memberNumber: string | null;
  email: string | null;
}

interface CategoryAdmin {
  id: string;
  member: Member;
  category: Category;
  assignedBy: {
    id: string;
    fullName: string;
  } | null;
  assignedAt: string;
  isActive: boolean;
}

interface CategoriesData {
  contributionCategories: Category[];
}

interface MembersData {
  membersList: Member[];
}

interface CategoryAdminsData {
  categoryAdmins: CategoryAdmin[];
}

interface AssignCategoryAdminResult {
  assignCategoryAdmin: {
    success: boolean;
    message: string;
    categoryAdmin?: CategoryAdmin;
  };
}

interface RemoveCategoryAdminResult {
  removeCategoryAdmin: {
    success: boolean;
    message: string;
  };
}

function CategoryAdminsPageContent() {
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedMember, setSelectedMember] = useState<string>("");
  const [assignCategory, setAssignCategory] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState<string>("");

  // Fetch categories
  const { data: categoriesData } = useQuery<CategoriesData>(
    GET_CONTRIBUTION_CATEGORIES
  );

  // Fetch members for assignment
  const { data: membersData } = useQuery<MembersData>(GET_MEMBERS_LIST, {
    variables: {
      search: searchTerm || null,
      isActive: true,
      limit: 50,
      offset: 0,
    },
  });

  // Fetch category admins
  const {
    data: adminsData,
    loading,
    error,
    refetch,
  } = useQuery<CategoryAdminsData>(GET_CATEGORY_ADMINS, {
    variables: {
      categoryId: selectedCategory === "all" ? null : selectedCategory,
    },
  });

  // Assign admin mutation
  const [assignAdmin, { loading: assigning }] =
    useMutation<AssignCategoryAdminResult>(ASSIGN_CATEGORY_ADMIN, {
      onCompleted: (data) => {
        if (data.assignCategoryAdmin.success) {
          toast.success(data.assignCategoryAdmin.message);
          setSelectedMember("");
          setAssignCategory("");
          refetch();
        } else {
          toast.error(data.assignCategoryAdmin.message);
        }
      },
      onError: (error) => {
        toast.error(error.message || "Failed to assign category admin");
      },
    });

  // Remove admin mutation
  const [removeAdmin, { loading: removing }] =
    useMutation<RemoveCategoryAdminResult>(REMOVE_CATEGORY_ADMIN, {
      onCompleted: (data) => {
        if (data.removeCategoryAdmin.success) {
          toast.success(data.removeCategoryAdmin.message);
          refetch();
        } else {
          toast.error(data.removeCategoryAdmin.message);
        }
      },
      onError: (error) => {
        toast.error(error.message || "Failed to remove category admin");
      },
    });

  const categories = categoriesData?.contributionCategories || [];
  const members = membersData?.membersList || [];
  const categoryAdmins = adminsData?.categoryAdmins || [];

  const handleAssignAdmin = () => {
    if (!selectedMember || !assignCategory) {
      toast.error("Please select both a member and a category");
      return;
    }

    assignAdmin({
      variables: {
        memberId: selectedMember,
        categoryId: assignCategory,
      },
    });
  };

  const handleRemoveAdmin = (categoryAdminId: string) => {
    if (confirm("Are you sure you want to remove this category admin role?")) {
      removeAdmin({
        variables: {
          categoryAdminId,
        },
      });
    }
  };

  // Group admins by category for display
  const adminsByCategory = categoryAdmins.reduce(
    (acc, admin) => {
      const categoryId = admin.category.id;
      if (!acc[categoryId]) {
        acc[categoryId] = {
          category: admin.category,
          admins: [],
        };
      }
      acc[categoryId].admins.push(admin);
      return acc;
    },
    {} as Record<string, { category: Category; admins: CategoryAdmin[] }>
  );

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Page Header */}
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Shield className="h-8 w-8" />
            Category Admins
          </h1>
          <p className="text-muted-foreground">
            Assign members as administrators for specific contribution
            categories
          </p>
        </div>

        {/* Statistics */}
        <div className="grid md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Categories
              </CardTitle>
              <FolderKey className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{categories.length}</div>
              <p className="text-xs text-muted-foreground">
                Active contribution categories
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Category Admins
              </CardTitle>
              <Shield className="h-4 w-4 text-blue-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {categoryAdmins.length}
              </div>
              <p className="text-xs text-muted-foreground">
                Total admin assignments
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Categories with Admins
              </CardTitle>
              <Users className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {Object.keys(adminsByCategory).length}
              </div>
              <p className="text-xs text-muted-foreground">
                Categories with assigned admins
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Assign New Category Admin */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="h-5 w-5" />
              Assign Category Admin
            </CardTitle>
            <CardDescription>
              Grant a member admin privileges for a specific contribution
              category
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              {/* Member Search/Select */}
              <div className="space-y-2">
                <Label htmlFor="member-search">Search Member</Label>
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="member-search"
                    placeholder="Search by name or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="member-select">Select Member</Label>
                <Select value={selectedMember} onValueChange={setSelectedMember}>
                  <SelectTrigger id="member-select">
                    <SelectValue placeholder="Choose a member" />
                  </SelectTrigger>
                  <SelectContent>
                    {members.map((member) => (
                      <SelectItem key={member.id} value={member.id}>
                        {member.fullName} ({member.phoneNumber})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Category Select */}
              <div className="space-y-2">
                <Label htmlFor="category-select">Select Category</Label>
                <Select value={assignCategory} onValueChange={setAssignCategory}>
                  <SelectTrigger id="category-select">
                    <SelectValue placeholder="Choose a category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                onClick={handleAssignAdmin}
                disabled={assigning || !selectedMember || !assignCategory}
              >
                {assigning ? (
                  "Assigning..."
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Assign Admin
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Filter by Category */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="h-5 w-5" />
              Filter Category Admins
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="max-w-sm">
              <Label htmlFor="filter-category">Filter by Category</Label>
              <Select
                value={selectedCategory}
                onValueChange={setSelectedCategory}
              >
                <SelectTrigger id="filter-category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Category Admins List */}
        <Card>
          <CardHeader>
            <CardTitle>Current Category Admins</CardTitle>
            <CardDescription>
              {categoryAdmins.length} admin assignment
              {categoryAdmins.length !== 1 ? "s" : ""} found
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && (
              <div className="text-center py-8 text-muted-foreground">
                Loading category admins...
              </div>
            )}

            {error && (
              <div className="text-center py-8 text-red-600">
                Error loading category admins: {error.message}
              </div>
            )}

            {!loading && !error && categoryAdmins.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No category admins assigned yet
              </div>
            )}

            {!loading && !error && categoryAdmins.length > 0 && (
              <div className="space-y-6">
                {Object.values(adminsByCategory).map(({ category, admins }) => (
                  <div key={category.id} className="border rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-4">
                      <FolderKey className="h-5 w-5 text-blue-600" />
                      <h3 className="font-semibold text-lg">{category.name}</h3>
                      <span className="text-sm text-muted-foreground">
                        ({category.code})
                      </span>
                      <span className="ml-auto text-sm bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100 px-2 py-1 rounded-full">
                        {admins.length} admin{admins.length !== 1 ? "s" : ""}
                      </span>
                    </div>
                    {category.description && (
                      <p className="text-sm text-muted-foreground mb-4">
                        {category.description}
                      </p>
                    )}
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b">
                            <th className="text-left p-2 font-medium">
                              Admin Name
                            </th>
                            <th className="text-left p-2 font-medium">
                              Phone Number
                            </th>
                            <th className="text-left p-2 font-medium">
                              Member #
                            </th>
                            <th className="text-left p-2 font-medium">
                              Assigned By
                            </th>
                            <th className="text-left p-2 font-medium">
                              Assigned On
                            </th>
                            <th className="text-center p-2 font-medium">
                              Actions
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {admins.map((admin) => (
                            <tr
                              key={admin.id}
                              className="border-b hover:bg-slate-50 dark:hover:bg-slate-800"
                            >
                              <td className="p-2">
                                <div className="font-medium">
                                  {admin.member.fullName}
                                </div>
                                {admin.member.email && (
                                  <div className="text-xs text-muted-foreground">
                                    {admin.member.email}
                                  </div>
                                )}
                              </td>
                              <td className="p-2 font-mono text-sm">
                                {admin.member.phoneNumber}
                              </td>
                              <td className="p-2 font-mono text-sm">
                                {admin.member.memberNumber || "-"}
                              </td>
                              <td className="p-2 text-sm">
                                {admin.assignedBy?.fullName || "System"}
                              </td>
                              <td className="p-2 text-sm">
                                {new Date(admin.assignedAt).toLocaleDateString(
                                  "en-GB",
                                  {
                                    day: "2-digit",
                                    month: "short",
                                    year: "numeric",
                                  }
                                )}
                              </td>
                              <td className="p-2 text-center">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleRemoveAdmin(admin.id)}
                                  disabled={removing}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}

export default function CategoryAdminsPage() {
  return (
    <AdminProtectedRoute requiredAccess="staff">
      <CategoryAdminsPageContent />
    </AdminProtectedRoute>
  );
}
